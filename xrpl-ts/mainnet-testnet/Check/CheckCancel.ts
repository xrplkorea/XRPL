import { Client, Wallet } from "xrpl"
import path from "path"
import dotenv from "dotenv"

dotenv.config({ path: path.join(__dirname, "../../.env") })

const CHECK_ID = "CHECK_ID_HERE" // 취소할 Check ID

/**
 * CheckCancel: 수표 취소
 * - 발행자(ADMIN) 또는 수취인(USER) 모두 취소 가능
 * - 만료(Expiration) 지난 수표는 누구나 취소 가능
 * - 이미 현금화된 수표는 취소 불가 (ledger에 존재하지 않음)
 */
export async function checkCancel() {
  const client = new Client("wss://s.altnet.rippletest.net:51233")
  await client.connect()

  const ADMIN_SEED = process.env.ADMIN_SEED
  if (!ADMIN_SEED) throw new Error("Missing env: ADMIN_SEED")

  const admin = Wallet.fromSeed(ADMIN_SEED.trim())

  const tx: any = {
    TransactionType: "CheckCancel",
    Account: admin.address,
    CheckID: CHECK_ID,
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
  checkCancel().catch(e => { console.error(e); process.exit(1) })
}
