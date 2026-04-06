import { Client, Wallet } from "xrpl"
import path from "path"
import dotenv from "dotenv"

dotenv.config({ path: path.join(__dirname, "../../.env") })

const OFFER_SEQUENCE = 0 // OfferCreate 결과의 Sequence를 입력

/**
 * OfferCancel: DEX 오더북의 기존 오퍼 취소
 * - 오퍼 생성자(Account)만 취소 가능
 * - OfferSequence = 취소할 OfferCreate 트랜잭션의 Sequence 번호
 */
export async function offerCancel() {
  const client = new Client("wss://s.altnet.rippletest.net:51233")
  await client.connect()

  const USER_SEED = process.env.USER_SEED
  if (!USER_SEED) throw new Error("Missing env: USER_SEED")

  const user = Wallet.fromSeed(USER_SEED.trim())

  const tx: any = {
    TransactionType: "OfferCancel",
    Account: user.address,
    OfferSequence: OFFER_SEQUENCE,
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
  offerCancel().catch(e => { console.error(e); process.exit(1) })
}
