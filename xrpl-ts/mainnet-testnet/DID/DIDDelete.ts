import { Client, Wallet } from "xrpl"
import path from "path"
import dotenv from "dotenv"

dotenv.config({ path: path.join(__dirname, "../../.env") })

/**
 * DIDDelete: DID 삭제
 * - 계정에 연결된 DID 객체를 삭제
 * - OwnerCount -1, reserve 반환
 */
export async function didDelete() {
  const client = new Client("wss://s.altnet.rippletest.net:51233")
  await client.connect()

  const ADMIN_SEED = process.env.ADMIN_SEED
  if (!ADMIN_SEED) throw new Error("Missing env: ADMIN_SEED")

  const admin = Wallet.fromSeed(ADMIN_SEED.trim())

  const tx: any = {
    TransactionType: "DIDDelete",
    Account: admin.address,
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
  didDelete().catch(e => { console.error(e); process.exit(1) })
}
