import { Client, Wallet } from "xrpl"
import path from "path"
import dotenv from "dotenv"

dotenv.config({ path: path.join(__dirname, "../../.env") })

/**
 * OfferCreate: DEX 오더북에 오퍼 생성
 * - USER가 10 ABC를 팔고 10 XRP를 받는 오퍼
 * - TakerGets = 시장이 가져가는 것 (= 내가 파는 것)
 * - TakerPays = 시장이 지불하는 것 (= 내가 받는 것)
 * - 즉시 체결되지 않으면 오더북에 남아서 대기
 */
export async function offerCreate() {
  const client = new Client("wss://s.altnet.rippletest.net:51233")
  await client.connect()

  const ADMIN_SEED = process.env.ADMIN_SEED
  const USER_SEED = process.env.USER_SEED
  if (!ADMIN_SEED || !USER_SEED) throw new Error("Missing env: ADMIN_SEED, USER_SEED")

  const admin = Wallet.fromSeed(ADMIN_SEED.trim())
  const user = Wallet.fromSeed(USER_SEED.trim())

  const tx: any = {
    TransactionType: "OfferCreate",
    Account: user.address,
    TakerGets: { currency: "ABC", issuer: admin.address, value: "10" }, // 내가 파는 것
    TakerPays: "10000000", // 10 XRP = 내가 받는 것
  }

  try {
    const prepared = await client.autofill(tx)
    const signed = user.sign(prepared)
    const result = await client.submitAndWait(signed.tx_blob)
    console.log(JSON.stringify(result, null, 2))

    // OfferSequence = 이 트랜잭션의 Sequence (취소 시 필요)
    const offerSequence = prepared.Sequence
    console.log("\n=== Offer Sequence (취소 시 필요) ===")
    console.log(offerSequence)
    console.log("====================================")

    return result
  } finally {
    await client.disconnect()
  }
}

if (require.main === module) {
  offerCreate().catch(e => { console.error(e); process.exit(1) })
}
