import { Client, Wallet } from "xrpl"
import path from "path"
import dotenv from "dotenv"

dotenv.config({ path: path.join(__dirname, "../../.env") })

/**
 * SignerListDelete: SignerList 제거
 * - SignerListSet에서 SignerQuorum을 0으로 설정하면 SignerList 삭제
 * - 마스터키로 실행 (멀티시그 불필요)
 * - OwnerCount -1, reserve 0.2 XRP 반환
 */
export async function signerListDelete() {
  const client = new Client("wss://s.altnet.rippletest.net:51233")
  await client.connect()

  const ADMIN_SEED = process.env.ADMIN_SEED
  if (!ADMIN_SEED) throw new Error("Missing env: ADMIN_SEED")

  const admin = Wallet.fromSeed(ADMIN_SEED.trim())

  const tx: any = {
    TransactionType: "SignerListSet",
    Account: admin.address,
    SignerQuorum: 0, // Quorum 0 = SignerList 삭제
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
  signerListDelete().catch(e => { console.error(e); process.exit(1) })
}
