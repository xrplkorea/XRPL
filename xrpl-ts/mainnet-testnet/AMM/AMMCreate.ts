import { Client, Wallet, Transaction } from "xrpl"
import path from "path"
import dotenv from "dotenv"

dotenv.config({ path: path.join(__dirname, "../../.env") })

/**
 * AMMCreate 트랜잭션: 새로운 AMM 풀을 생성
 * - 두 자산을 예치해 풀을 만들고 초기 TradingFee 설정
 * - TradingFee 범위: 0 ~ 1000 (0.001% ~ 1%)
 */
export async function AMMCreate() {
  const client = new Client("wss://s.altnet.rippletest.net:51233")
  await client.connect()

  const ADMIN_SEED = process.env.ADMIN_SEED
  if (!ADMIN_SEED) throw new Error("Missing env: ADMIN_SEED")

  const admin = Wallet.fromSeed(ADMIN_SEED.trim())

  // Asset: XRP, Asset2: ABC (ADMIN 발행 IOU), TradingFee: 30 (0.03%)
  const tx: any = {
    TransactionType: "AMMCreate",
    Account: admin.address,
    Amount: "10000000", // 10 XRP (drops)
    Amount2: {
      currency: "ABC",
      issuer: admin.address,
      value: "10"
    },
    TradingFee: 30
  }

  try {
    const prepared = await client.autofill(tx)
    const signed = admin.sign(prepared)
    const result = await client.submitAndWait(signed.tx_blob)
    console.log(JSON.stringify(result, null, 2))
    return result
  } finally {
    await client.disconnect()
  }
}

if (require.main === module) {
  AMMCreate().catch(e => { console.error(e); process.exit(1) })
}
