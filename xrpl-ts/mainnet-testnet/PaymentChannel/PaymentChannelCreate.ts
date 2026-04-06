import { Client, Wallet } from "xrpl"
import path from "path"
import dotenv from "dotenv"

dotenv.config({ path: path.join(__dirname, "../../.env") })

export async function paymentChannelCreate() {
  const client = new Client("wss://s.altnet.rippletest.net:51233")
  await client.connect()

  const SOURCE_SEED = process.env.ADMIN_SEED
  const DEST_SEED = process.env.USER_SEED
  if (!SOURCE_SEED) throw new Error("Missing env: ADMIN_SEED")
  if (!DEST_SEED) throw new Error("Missing env: USER_SEED")

  const source = Wallet.fromSeed(SOURCE_SEED.trim())
  const destination = Wallet.fromSeed(DEST_SEED.trim())

  const tx: any = {
    TransactionType: "PaymentChannelCreate",
    Account: source.address,
    Destination: destination.address,
    Amount: "10000000", // 10 XRP
    PublicKey: source.publicKey,
    SettleDelay: 86400, // 1일 (초)
  }

  try {
    const prepared = await client.autofill(tx)
    const signed = source.sign(prepared)
    const result = await client.submitAndWait(signed.tx_blob)

    console.log(JSON.stringify(result, null, 2))

    // Channel ID 추출 (CreatedNode의 LedgerIndex)
    const meta = result.result.meta as any
    if (meta && meta.AffectedNodes) {
      for (const node of meta.AffectedNodes) {
        if (
          node.CreatedNode &&
          node.CreatedNode.LedgerEntryType === "PayChannel"
        ) {
          console.log("\n=== Channel ID ===")
          console.log(node.CreatedNode.LedgerIndex)
          console.log("==================")
          break
        }
      }
    }

    return result
  } finally {
    await client.disconnect()
  }
}

if (require.main === module) {
  paymentChannelCreate().catch(e => { console.error(e); process.exit(1) })
}
