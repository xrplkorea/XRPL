import { Client, Wallet } from "xrpl"
import path from "path"
import dotenv from "dotenv"

dotenv.config({ path: path.join(__dirname, "../../.env") })

const CHECK_ID = "CHECK_ID_HERE" // CheckCreate 결과에서 복사

/**
 * CheckCash: 수표 현금화
 * - Destination(USER)만 실행 가능
 * - Amount: 정확한 금액 수령 (SendMax 이하)
 * - DeliverMin: 최소 금액 지정 (IOU 부분 현금화 시 유용)
 * - Amount와 DeliverMin 중 하나만 지정
 */
export async function checkCash() {
  const client = new Client("wss://s.altnet.rippletest.net:51233")
  await client.connect()

  const USER_SEED = process.env.USER_SEED
  if (!USER_SEED) throw new Error("Missing env: USER_SEED")

  const user = Wallet.fromSeed(USER_SEED.trim())

  const tx: any = {
    TransactionType: "CheckCash",
    Account: user.address,
    CheckID: CHECK_ID,
    Amount: "10000000", // 10 XRP 정확히 수령
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
  checkCash().catch(e => { console.error(e); process.exit(1) })
}
