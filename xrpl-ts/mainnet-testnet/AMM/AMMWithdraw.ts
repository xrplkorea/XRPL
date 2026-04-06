import { Client, Wallet } from "xrpl"
import path from "path"
import dotenv from "dotenv"

dotenv.config({ path: path.join(__dirname, "../../.env") })

/**
 * AMMWithdraw 트랜잭션: AMM 풀에서 유동성 제거
 * - LPToken을 제출하면, 그 비율만큼 자산(A/B)을 반환받음
 * - 전체 인출(tfWithdrawAll) 또는 부분 인출 가능
 */
export async function AMMWithdraw() {
  const client = new Client("wss://s.altnet.rippletest.net:51233")
  await client.connect()

  const ADMIN_SEED = process.env.ADMIN_SEED
  if (!ADMIN_SEED) throw new Error("Missing env: ADMIN_SEED")

  const admin = Wallet.fromSeed(ADMIN_SEED.trim())

  // ADMIN이 XRP/ABC 풀에서 전체 유동성 인출
  const tx: any = {
    TransactionType: "AMMWithdraw",
    Account: admin.address,
    Asset: { currency: "XRP" },
    Asset2: { currency: "ABC", issuer: admin.address },
    Flags: 0x00020000 // tfWithdrawAll
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
  AMMWithdraw().catch(e => { console.error(e); process.exit(1) })
}
