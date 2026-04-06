import { Client, Wallet, convertStringToHex } from "xrpl"
import path from "path"
import dotenv from "dotenv"

dotenv.config({ path: path.join(__dirname, "../../.env") })

/**
 * NFTokenMint: NFT 발행
 * - NFTokenTaxon: 임의의 분류값 (0 가능)
 * - Flags: tfBurnable(1) + tfTransferable(8) = 9
 * - TransferFee: 2차 판매 시 Issuer에게 돌아가는 로열티 (0~50000, 0.000%~50.000%)
 * - URI: hex 인코딩된 메타데이터 URI (최대 256바이트)
 */
export async function nftMint() {
  const client = new Client("wss://s.altnet.rippletest.net:51233")
  await client.connect()

  const ADMIN_SEED = process.env.ADMIN_SEED
  if (!ADMIN_SEED) throw new Error("Missing env: ADMIN_SEED")

  const admin = Wallet.fromSeed(ADMIN_SEED.trim())

  const tx: any = {
    TransactionType: "NFTokenMint",
    Account: admin.address,
    NFTokenTaxon: 0,
    Flags: 9, // tfBurnable(1) + tfTransferable(8)
    TransferFee: 5000, // 5% 로열티
    URI: convertStringToHex("https://example.com/nft/metadata.json"),
  }

  try {
    const prepared = await client.autofill(tx)
    const signed = admin.sign(prepared)
    const result = await client.submitAndWait(signed.tx_blob)
    console.log(JSON.stringify(result, null, 2))

    const nftokenId = (result.result.meta as any)?.nftoken_id
    if (nftokenId) {
      console.log("\n=== NFToken ID ===")
      console.log(nftokenId)
      console.log("==================")
    }

    return result
  } finally {
    await client.disconnect()
  }
}

if (require.main === module) {
  nftMint().catch(e => { console.error(e); process.exit(1) })
}
