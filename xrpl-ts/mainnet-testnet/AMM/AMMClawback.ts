import { Client, Wallet } from "xrpl"
import path from "path"
import dotenv from "dotenv"

dotenv.config({ path: path.join(__dirname, "../../.env") })

const HOLDER = "HOLDER_ADDRESS_HERE" // Clawback 대상 LP 계정 주소

/**
 * AMMClawback: Asset Issuer가 AMM 풀에서 특정 LP의 자산을 강제 회수
 * - 전제조건: Issuer 계정에 lsfAllowTrustLineClawback 플래그가 활성화되어 있어야 함
 * - lsfAllowTrustLineClawback은 계정에 TrustLine이 없을 때만 설정 가능
 * - XRP는 Clawback 불가 (IOU/MPT만 가능)
 */
export async function AMMClawback() {
  const client = new Client("wss://s.altnet.rippletest.net:51233")
  await client.connect()

  const ADMIN_SEED = process.env.ADMIN_SEED
  if (!ADMIN_SEED) throw new Error("Missing env: ADMIN_SEED")

  const admin = Wallet.fromSeed(ADMIN_SEED.trim())

  const tx: any = {
    TransactionType: "AMMClawback",
    Account: admin.address,
    Asset: { currency: "XRP" },
    Asset2: { currency: "ABC", issuer: admin.address },
    Amount: {
      currency: "ABC",
      issuer: admin.address,
      value: "10"
    },
    Holder: HOLDER
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
  AMMClawback().catch(e => { console.error(e); process.exit(1) })
}
