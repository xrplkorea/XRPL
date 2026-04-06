import { Client, Wallet } from "xrpl"
import path from "path"
import dotenv from "dotenv"

dotenv.config({ path: path.join(__dirname, "../../.env") })

const CHANNEL_ID = "CHANNEL_ID_HERE" // PaymentChannelCreate 결과에서 복사
const SIGNATURE = "SIGNATURE_HERE"   // ChannelAuthorize 결과에서 복사

export async function paymentChannelClaim() {
  const client = new Client("wss://s.altnet.rippletest.net:51233")
  await client.connect()

  const SOURCE_SEED = process.env.ADMIN_SEED
  const DEST_SEED = process.env.USER_SEED
  if (!SOURCE_SEED) throw new Error("Missing env: ADMIN_SEED")
  if (!DEST_SEED) throw new Error("Missing env: USER_SEED")

  const source = Wallet.fromSeed(SOURCE_SEED.trim())
  const destination = Wallet.fromSeed(DEST_SEED.trim())

  const tx: any = {
    TransactionType: "PaymentChannelClaim",
    Account: destination.address,
    Channel: CHANNEL_ID,
    Amount: "1000000",   // 승인된 누적 금액 (1 XRP)
    Balance: "1000000",  // Claim할 누적 금액 (1 XRP)
    Signature: SIGNATURE,
    PublicKey: source.publicKey,
    Flags: 0x00020000,   // tfClose — Claim과 동시에 채널 종료
  }

  try {
    const prepared = await client.autofill(tx)
    const signed = destination.sign(prepared)
    const result = await client.submitAndWait(signed.tx_blob)
    console.log(JSON.stringify(result, null, 2))
    return result
  } finally {
    await client.disconnect()
  }
}

if (require.main === module) {
  paymentChannelClaim().catch(e => { console.error(e); process.exit(1) })
}
