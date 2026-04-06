import { Client, Wallet } from "xrpl"
import path from "path"
import dotenv from "dotenv"

dotenv.config({ path: path.join(__dirname, "../../.env") })

const SELL_OFFER_ID = "SELL_OFFER_ID_HERE" // NFTokenCreateSellOffer 결과에서 복사

/**
 * NFTokenAcceptOffer: 구매자가 판매 오퍼 수락 → NFT 소유권 이전
 * - NFTokenSellOffer: 수락할 판매 오퍼 ID
 * - 구매 대금(Amount)이 판매자에게 전송되고 NFT 소유권이 구매자로 이전
 */
export async function nftAcceptOffer() {
  const client = new Client("wss://s.altnet.rippletest.net:51233")
  await client.connect()

  const USER_SEED = process.env.USER_SEED
  if (!USER_SEED) throw new Error("Missing env: USER_SEED")

  const user = Wallet.fromSeed(USER_SEED.trim())

  const tx: any = {
    TransactionType: "NFTokenAcceptOffer",
    Account: user.address,
    NFTokenSellOffer: SELL_OFFER_ID,
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
  nftAcceptOffer().catch(e => { console.error(e); process.exit(1) })
}
