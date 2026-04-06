import { Client, Wallet } from "xrpl"
import path from "path"
import dotenv from "dotenv"

dotenv.config({ path: path.join(__dirname, "../../.env") })

const NFTOKEN_ID = "NFTOKEN_ID_HERE" // NFTokenMint 결과에서 복사

/**
 * NFTokenCreateOffer (Sell): 소유자가 판매 오퍼 생성
 * - Flags: tfSellNFToken(1) = 판매 오퍼
 * - Amount: 판매 가격 (XRP drops)
 * - Destination: 특정 구매자만 지정 (선택)
 */
export async function nftCreateSellOffer() {
  const client = new Client("wss://s.altnet.rippletest.net:51233")
  await client.connect()

  const ADMIN_SEED = process.env.ADMIN_SEED
  if (!ADMIN_SEED) throw new Error("Missing env: ADMIN_SEED")

  const admin = Wallet.fromSeed(ADMIN_SEED.trim())

  const tx: any = {
    TransactionType: "NFTokenCreateOffer",
    Account: admin.address,
    NFTokenID: NFTOKEN_ID,
    Amount: "5000000", // 5 XRP
    Flags: 1, // tfSellNFToken
  }

  try {
    const prepared = await client.autofill(tx)
    const signed = admin.sign(prepared)
    const result = await client.submitAndWait(signed.tx_blob)
    console.log(JSON.stringify(result, null, 2))

    const offerId = (result.result.meta as any)?.offer_id
    if (offerId) {
      console.log("\n=== Offer ID ===")
      console.log(offerId)
      console.log("================")
    }

    return result
  } finally {
    await client.disconnect()
  }
}

if (require.main === module) {
  nftCreateSellOffer().catch(e => { console.error(e); process.exit(1) })
}
