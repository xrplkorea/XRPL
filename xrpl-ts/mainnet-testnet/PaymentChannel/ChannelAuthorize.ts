import { Client } from "xrpl"
import path from "path"
import dotenv from "dotenv"

dotenv.config({ path: path.join(__dirname, "../../.env") })

const CHANNEL_ID = "CHANNEL_ID_HERE" // PaymentChannelCreate 결과에서 복사

export async function channelAuthorize() {
  const client = new Client("wss://s.altnet.rippletest.net:51233")
  await client.connect()

  const SOURCE_SEED = process.env.ADMIN_SEED
  if (!SOURCE_SEED) throw new Error("Missing env: ADMIN_SEED")

  try {
    // channel_authorize: Source가 오프체인 서명 생성 (트랜잭션 아님)
    // 주의: seed를 서버에 전송하므로 신뢰할 수 있는 서버에서만 사용
    const result = await client.request({
      command: "channel_authorize",
      channel_id: CHANNEL_ID,
      secret: SOURCE_SEED.trim(),
      amount: "1000000", // 1 XRP 분량 승인 (누적값)
    } as any)

    console.log(JSON.stringify(result, null, 2))

    const sig = (result.result as any).signature
    if (sig) {
      console.log("\n=== Signature ===")
      console.log(sig)
      console.log("=================")
    }

    return result
  } finally {
    await client.disconnect()
  }
}

if (require.main === module) {
  channelAuthorize().catch(e => { console.error(e); process.exit(1) })
}
