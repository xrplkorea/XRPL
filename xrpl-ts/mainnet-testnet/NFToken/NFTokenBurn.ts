import { Client, Wallet } from "xrpl"
import path from "path"
import dotenv from "dotenv"

dotenv.config({ path: path.join(__dirname, "../../.env") })

const NFTOKEN_ID = "NFTOKEN_ID_HERE" // 소각할 NFToken ID

/**
 * NFTokenBurn: NFT 소각
 * - 현재 소유자가 직접 소각하거나
 * - Issuer가 tfBurnable로 발행한 경우 Owner 필드로 타인의 NFT 소각 가능
 */
export async function nftBurn() {
  const client = new Client("wss://s.altnet.rippletest.net:51233")
  await client.connect()

  const USER_SEED = process.env.USER_SEED
  if (!USER_SEED) throw new Error("Missing env: USER_SEED")

  const user = Wallet.fromSeed(USER_SEED.trim())

  const tx: any = {
    TransactionType: "NFTokenBurn",
    Account: user.address,
    NFTokenID: NFTOKEN_ID,
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
  nftBurn().catch(e => { console.error(e); process.exit(1) })
}
