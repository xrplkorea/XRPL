import { Client, Wallet } from "xrpl"
import path from "path"
import dotenv from "dotenv"

dotenv.config({ path: path.join(__dirname, "../../.env") })

/**
 * AMMVote 트랜잭션
 * - LPToken 보유자가 AMM 인스턴스의 TradingFee에 투표
 * - TradingFee 범위: 0 ~ 1000 (0.001% ~ 1%)
 */
export async function AMMVote() {
  const client = new Client("wss://s.altnet.rippletest.net:51233")
  await client.connect()

  const USER_SEED = process.env.USER_SEED
  const ADMIN_SEED = process.env.ADMIN_SEED
  if (!USER_SEED || !ADMIN_SEED) throw new Error("Missing env: USER_SEED, ADMIN_SEED")

  const user = Wallet.fromSeed(USER_SEED.trim())
  const admin = Wallet.fromSeed(ADMIN_SEED.trim())

  // USER가 XRP/ABC 풀의 TradingFee를 0.025%로 투표
  const tx: any = {
    TransactionType: "AMMVote",
    Account: user.address,
    Asset: { currency: "XRP" },
    Asset2: { currency: "ABC", issuer: admin.address },
    TradingFee: 25
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
  AMMVote().catch(e => { console.error(e); process.exit(1) })
}
