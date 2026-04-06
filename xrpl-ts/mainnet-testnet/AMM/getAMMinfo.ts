import { Client, Wallet } from "xrpl"
import path from "path"
import dotenv from "dotenv"

dotenv.config({ path: path.join(__dirname, "../../.env") })

/**
 * 특정 AMM 풀의 정보 조회
 * - 풀 상태(잔액, TradingFee, LP Token 등) 확인 가능
 * - LP Token currency/issuer 확인 후 Withdraw/Bid 등에 활용
 */
export async function getAMMInfo() {
  const client = new Client("wss://s.altnet.rippletest.net:51233")
  await client.connect()

  const ADMIN_SEED = process.env.ADMIN_SEED
  if (!ADMIN_SEED) throw new Error("Missing env: ADMIN_SEED")

  const admin = Wallet.fromSeed(ADMIN_SEED.trim())

  try {
    const result = await client.request({
      command: "amm_info",
      asset: { currency: "XRP" },
      asset2: { currency: "ABC", issuer: admin.address }
    } as any)

    console.log(JSON.stringify(result.result, null, 2))

    const amm = (result.result as any).amm
    if (amm?.lp_token) {
      console.log("\n=== LP Token Info ===")
      console.log("currency:", amm.lp_token.currency)
      console.log("issuer:", amm.lp_token.issuer)
      console.log("value:", amm.lp_token.value)
      console.log("====================")
    }

    return result.result
  } finally {
    await client.disconnect()
  }
}

if (require.main === module) {
  getAMMInfo().catch(e => { console.error(e); process.exit(1) })
}
