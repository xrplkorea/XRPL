import { Client, Wallet } from "xrpl"
import path from "path"
import dotenv from "dotenv"

dotenv.config({ path: path.join(__dirname, "../../.env") })

const fromHex = (hex: string) => Buffer.from(hex, "hex").toString("utf8")

/**
 * DID 조회: ledger_entry로 계정의 DID 객체 조회
 * - 저장된 Data, DIDDocument, URI는 hex → 디코딩하여 출력
 */
export async function didGet() {
  const client = new Client("wss://s.altnet.rippletest.net:51233")
  await client.connect()

  const ADMIN_SEED = process.env.ADMIN_SEED
  if (!ADMIN_SEED) throw new Error("Missing env: ADMIN_SEED")

  const admin = Wallet.fromSeed(ADMIN_SEED.trim())

  try {
    const result = await client.request({
      command: "ledger_entry",
      did: admin.address,
      ledger_index: "validated",
    } as any)

    console.log(JSON.stringify(result.result, null, 2))

    const node = (result.result as any).node
    if (node) {
      console.log("\n=== DID Decoded ===")
      if (node.URI) console.log("URI:", fromHex(node.URI))
      if (node.Data) console.log("Data:", fromHex(node.Data))
      if (node.DIDDocument) console.log("DIDDocument:", fromHex(node.DIDDocument))
      console.log("===================")
    }

    return result.result
  } finally {
    await client.disconnect()
  }
}

if (require.main === module) {
  didGet().catch(e => { console.error(e); process.exit(1) })
}
