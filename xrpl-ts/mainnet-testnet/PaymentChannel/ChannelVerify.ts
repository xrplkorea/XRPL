import { Client, Wallet } from "xrpl"
import path from "path"
import dotenv from "dotenv"

dotenv.config({ path: path.join(__dirname, "../../.env") })

const CHANNEL_ID = "CHANNEL_ID_HERE" // PaymentChannelCreate 결과에서 복사
const SIGNATURE = "SIGNATURE_HERE"   // ChannelAuthorize 결과에서 복사

export async function channelVerify() {
  const client = new Client("wss://s.altnet.rippletest.net:51233")
  await client.connect()

  const SOURCE_SEED = process.env.ADMIN_SEED
  if (!SOURCE_SEED) throw new Error("Missing env: ADMIN_SEED")

  const source = Wallet.fromSeed(SOURCE_SEED.trim())

  try {
    // channel_verify: 서명 유효성 검증 (트랜잭션 아님)
    const result = await client.request({
      command: "channel_verify",
      channel_id: CHANNEL_ID,
      public_key: source.publicKey,
      signature: SIGNATURE,
      amount: "1000000", // ChannelAuthorize와 동일한 금액
    } as any)

    console.log(JSON.stringify(result, null, 2))

    const verified = (result.result as any).signature_verified
    if (verified !== undefined) {
      console.log("\n=== Verification Result ===")
      console.log("signature_verified:", verified)
      console.log("===========================")
    }

    return result
  } finally {
    await client.disconnect()
  }
}

if (require.main === module) {
  channelVerify().catch(e => { console.error(e); process.exit(1) })
}
