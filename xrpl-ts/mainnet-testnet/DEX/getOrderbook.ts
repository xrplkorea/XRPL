import { Client, Wallet } from "xrpl"
import path from "path"
import dotenv from "dotenv"

dotenv.config({ path: path.join(__dirname, "../../.env") })

/**
 * getOrderbook: DEX 오더북 조회 (book_offers RPC)
 * - XRP ↔ ABC 오더북을 양방향으로 조회
 * - DomainID 없음 = 일반(오픈) 오더북
 */
export async function getOrderbook() {
  const client = new Client("wss://s.altnet.rippletest.net:51233")
  await client.connect()

  const ADMIN_SEED = process.env.ADMIN_SEED
  if (!ADMIN_SEED) throw new Error("Missing env: ADMIN_SEED")

  const admin = Wallet.fromSeed(ADMIN_SEED.trim())

  try {
    // ABC를 팔고 XRP를 받는 오퍼 조회
    console.log("=== ABC → XRP 오더북 ===")
    const res1 = await client.request({
      command: "book_offers",
      taker_gets: { currency: "XRP" },
      taker_pays: { currency: "ABC", issuer: admin.address },
      limit: 10,
    } as any)
    const offers1 = (res1.result as any).offers || []
    console.log(`오퍼 ${offers1.length}건`)
    console.log(JSON.stringify(offers1, null, 2))

    // XRP를 팔고 ABC를 받는 오퍼 조회
    console.log("\n=== XRP → ABC 오더북 ===")
    const res2 = await client.request({
      command: "book_offers",
      taker_gets: { currency: "ABC", issuer: admin.address },
      taker_pays: { currency: "XRP" },
      limit: 10,
    } as any)
    const offers2 = (res2.result as any).offers || []
    console.log(`오퍼 ${offers2.length}건`)
    console.log(JSON.stringify(offers2, null, 2))
  } finally {
    await client.disconnect()
  }
}

if (require.main === module) {
  getOrderbook().catch(e => { console.error(e); process.exit(1) })
}
