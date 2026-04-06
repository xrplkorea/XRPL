import { Client, Wallet } from "xrpl"
import path from "path"
import dotenv from "dotenv"

dotenv.config({ path: path.join(__dirname, "../../.env") })

const CHANNEL_ID = "CHANNEL_ID_HERE" // PaymentChannelCreate 결과에서 복사

export async function paymentChannelFund() {
  const client = new Client("wss://s.altnet.rippletest.net:51233")
  await client.connect()

  const SOURCE_SEED = process.env.ADMIN_SEED
  if (!SOURCE_SEED) throw new Error("Missing env: ADMIN_SEED")

  const source = Wallet.fromSeed(SOURCE_SEED.trim())

  const tx: any = {
    TransactionType: "PaymentChannelFund",
    Account: source.address,
    Channel: CHANNEL_ID,
    Amount: "5000000", // 5 XRP 추가 예치
  }

  try {
    const prepared = await client.autofill(tx)
    const signed = source.sign(prepared)
    const result = await client.submitAndWait(signed.tx_blob)
    console.log(JSON.stringify(result, null, 2))
    return result
  } finally {
    await client.disconnect()
  }
}

if (require.main === module) {
  paymentChannelFund().catch(e => { console.error(e); process.exit(1) })
}
