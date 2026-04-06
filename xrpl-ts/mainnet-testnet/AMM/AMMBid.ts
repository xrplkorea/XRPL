import { Client, Wallet } from "xrpl"
import path from "path"
import dotenv from "dotenv"

dotenv.config({ path: path.join(__dirname, "../../.env") })

const LP_TOKEN_CURRENCY = "LP_TOKEN_CURRENCY_HERE" // getAMMinfo 결과에서 복사
const LP_TOKEN_ISSUER = "LP_TOKEN_ISSUER_HERE"     // getAMMinfo 결과에서 복사

/**
 * AMMBid: AMM 풀의 경매 슬롯 입찰
 * - 입찰자는 LPToken 단위로 BidMin/BidMax 지정 가능
 * - 승리 시 24시간 동안 수수료 할인 (TradingFee / 10)
 */
export async function AMMBid() {
  const client = new Client("wss://s.altnet.rippletest.net:51233")
  await client.connect()

  const USER_SEED = process.env.USER_SEED
  const ADMIN_SEED = process.env.ADMIN_SEED
  if (!USER_SEED || !ADMIN_SEED) throw new Error("Missing env: USER_SEED, ADMIN_SEED")

  const user = Wallet.fromSeed(USER_SEED.trim())
  const admin = Wallet.fromSeed(ADMIN_SEED.trim())

  // USER가 XRP/ABC 풀의 경매 슬롯에 입찰
  const tx: any = {
    TransactionType: "AMMBid",
    Account: user.address,
    Asset: { currency: "XRP" },
    Asset2: { currency: "ABC", issuer: admin.address },
    BidMin: {
      currency: LP_TOKEN_CURRENCY,
      issuer: LP_TOKEN_ISSUER,
      value: "1"
    }
  }

  try {
    const prepared = await client.autofill(tx)
    const signed = user.sign(prepared)
    const result = await client.submitAndWait(signed.tx_blob)
    console.log(JSON.stringify(result, null, 2))
    return result
  } finally {
    await client.disconnect()
  }
}

if (require.main === module) {
  AMMBid().catch(e => { console.error(e); process.exit(1) })
}
