import { Client, Wallet } from "xrpl"
import path from "path"
import dotenv from "dotenv"

dotenv.config({ path: path.join(__dirname, "../../.env") })

const ORACLE_DOCUMENT_ID = 1
const PROVIDER = "636174616c797a65" // "catalyze" in hex
const ASSET_CLASS = "63757272656E6379" // "currency" in hex

export async function oracleSet() {
  const client = new Client("wss://s.altnet.rippletest.net:51233")
  await client.connect()

  const OWNER_SEED = process.env.ADMIN_SEED
  if (!OWNER_SEED) throw new Error("Missing env: ADMIN_SEED")

  const owner = Wallet.fromSeed(OWNER_SEED.trim())

  // LastUpdateTime은 Unix Time (Ripple epoch가 아님)
  const lastUpdateTime = Math.floor(Date.now() / 1000)

  const tx: any = {
    TransactionType: "OracleSet",
    Account: owner.address,
    OracleDocumentID: ORACLE_DOCUMENT_ID,
    Provider: PROVIDER,
    AssetClass: ASSET_CLASS,
    LastUpdateTime: lastUpdateTime,
    PriceDataSeries: [
      {
        PriceData: {
          BaseAsset: "XRP",
          QuoteAsset: "USD",
          AssetPrice: "2a",     // 42 in hex = $0.42 (Scale=2 → 42 * 10^-2)
          Scale: 2,
        },
      },
      {
        PriceData: {
          BaseAsset: "BTC",
          QuoteAsset: "USD",
          AssetPrice: "F4240",  // 1000000 in hex = $10,000 (Scale=2 → 1000000 * 10^-2)
          Scale: 2,
        },
      },
    ],
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
  oracleSet().catch(e => { console.error(e); process.exit(1) })
}
