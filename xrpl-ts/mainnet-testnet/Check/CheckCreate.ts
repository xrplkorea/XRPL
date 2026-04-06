import { Client, Wallet } from "xrpl"
import path from "path"
import dotenv from "dotenv"

dotenv.config({ path: path.join(__dirname, "../../.env") })

/**
 * CheckCreate: 수표 생성
 * - ADMIN이 USER에게 10 XRP 수표 발행
 * - Destination이 CheckCash로 현금화하기 전까지 자금이 이동하지 않음
 * - Expiration: 선택적 — 만료 시간 이후 수표 무효화 (Ripple epoch)
 */
export async function checkCreate() {
  const client = new Client("wss://s.altnet.rippletest.net:51233")
  await client.connect()

  const ADMIN_SEED = process.env.ADMIN_SEED
  const USER_SEED = process.env.USER_SEED
  if (!ADMIN_SEED || !USER_SEED) throw new Error("Missing env: ADMIN_SEED, USER_SEED")

  const admin = Wallet.fromSeed(ADMIN_SEED.trim())
  const user = Wallet.fromSeed(USER_SEED.trim())

  const tx: any = {
    TransactionType: "CheckCreate",
    Account: admin.address,
    Destination: user.address,
    SendMax: "10000000", // 10 XRP (최대 인출 가능 금액)
  }

  try {
    const prepared = await client.autofill(tx)
    const signed = admin.sign(prepared)
    const result = await client.submitAndWait(signed.tx_blob)
    console.log(JSON.stringify(result, null, 2))

    // Check ID 추출 (meta에서 생성된 Check 객체의 LedgerIndex)
    const meta = result.result.meta as any
    const created = meta?.AffectedNodes?.find(
      (n: any) => n.CreatedNode?.LedgerEntryType === "Check"
    )
    const checkId = created?.CreatedNode?.LedgerIndex
    if (checkId) {
      console.log("\n=== Check ID ===")
      console.log(checkId)
      console.log("================")
    }

    return result
  } finally {
    await client.disconnect()
  }
}

if (require.main === module) {
  checkCreate().catch(e => { console.error(e); process.exit(1) })
}
