import { Client, Wallet } from "xrpl"
import path from "path"
import dotenv from "dotenv"

dotenv.config({ path: path.join(__dirname, "../../.env") })

const toHex = (str: string) => Buffer.from(str, "utf8").toString("hex").toUpperCase()

/**
 * DIDSet: DID 생성 또는 업데이트
 * - Data, DIDDocument, URI 중 최소 1개 필수 (모두 hex 인코딩)
 * - 계정당 DID 1개만 존재. 재실행 시 업데이트
 * - 필드 삭제: 빈 문자열("")로 설정
 */
export async function didSet() {
  const client = new Client("wss://s.altnet.rippletest.net:51233")
  await client.connect()

  const ADMIN_SEED = process.env.ADMIN_SEED
  if (!ADMIN_SEED) throw new Error("Missing env: ADMIN_SEED")

  const admin = Wallet.fromSeed(ADMIN_SEED.trim())

  const tx: any = {
    TransactionType: "DIDSet",
    Account: admin.address,
    URI: toHex("https://example.com/did/document.json"),
    Data: toHex("Catalyze Research - XRPL Hackathon"),
  }

  try {
    const prepared = await client.autofill(tx)
    const signed = admin.sign(prepared)
    const result = await client.submitAndWait(signed.tx_blob)
    console.log(JSON.stringify(result, null, 2))
    return result
  } finally {
    await client.disconnect()
  }
}

if (require.main === module) {
  didSet().catch(e => { console.error(e); process.exit(1) })
}
