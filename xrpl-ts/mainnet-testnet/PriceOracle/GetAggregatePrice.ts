import { Client, Wallet } from "xrpl"
import path from "path"
import dotenv from "dotenv"

dotenv.config({ path: path.join(__dirname, "../../.env") })

const ORACLE_DOCUMENT_ID = 1

export async function getAggregatePrice() {
  const client = new Client("wss://s.altnet.rippletest.net:51233")
  await client.connect()

  const OWNER_SEED = process.env.ADMIN_SEED
  if (!OWNER_SEED) throw new Error("Missing env: ADMIN_SEED")

  const owner = Wallet.fromSeed(OWNER_SEED.trim())

  try {
    const result = await client.request({
      command: "get_aggregate_price",
      base_asset: "XRP",
      quote_asset: "USD",
      oracles: [
        {
          account: owner.address,
          oracle_document_id: ORACLE_DOCUMENT_ID,
        },
      ],
      trim: 20,
    } as any)

    console.log(JSON.stringify(result, null, 2))
    return result
  } finally {
    await client.disconnect()
  }
}

if (require.main === module) {
  getAggregatePrice().catch(e => { console.error(e); process.exit(1) })
}
