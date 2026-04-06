import { Client, Wallet } from "xrpl"
import path from "path"
import dotenv from "dotenv"

dotenv.config({ path: path.join(__dirname, "../../.env") })

const ORACLE_DOCUMENT_ID = 1

export async function oracleDelete() {
  const client = new Client("wss://s.altnet.rippletest.net:51233")
  await client.connect()

  const OWNER_SEED = process.env.ADMIN_SEED
  if (!OWNER_SEED) throw new Error("Missing env: ADMIN_SEED")

  const owner = Wallet.fromSeed(OWNER_SEED.trim())

  const tx: any = {
    TransactionType: "OracleDelete",
    Account: owner.address,
    OracleDocumentID: ORACLE_DOCUMENT_ID,
  }

  try {
    const prepared = await client.autofill(tx)
    const signed = owner.sign(prepared)
    const result = await client.submitAndWait(signed.tx_blob)
    console.log(JSON.stringify(result, null, 2))
    return result
  } finally {
    await client.disconnect()
  }
}

if (require.main === module) {
  oracleDelete().catch(e => { console.error(e); process.exit(1) })
}
