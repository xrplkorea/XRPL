import { Client, Wallet, multisign } from "xrpl"
import path from "path"
import dotenv from "dotenv"

dotenv.config({ path: path.join(__dirname, "../../.env") })

const SIGNER2_SEED = "SIGNER2_SEED_HERE" // SignerListSet 결과에서 복사

/**
 * MultiSignTx: 멀티시그로 Payment 실행
 * - ADMIN 계정에서 USER 계정으로 1 XRP 전송
 * - Signer 1 (USER, weight 2) + Signer 2 (weight 1) = 3 ≥ quorum 3
 * - 각 서명자가 독립적으로 서명 → 합쳐서 제출
 */
export async function multiSignTx() {
  const client = new Client("wss://s.altnet.rippletest.net:51233")
  await client.connect()

  const ADMIN_SEED = process.env.ADMIN_SEED
  const USER_SEED = process.env.USER_SEED
  if (!ADMIN_SEED || !USER_SEED) throw new Error("Missing env: ADMIN_SEED, USER_SEED")

  const admin = Wallet.fromSeed(ADMIN_SEED.trim())
  const user = Wallet.fromSeed(USER_SEED.trim())
  const signer2 = Wallet.fromSeed(SIGNER2_SEED.trim())

  // 1. 트랜잭션 준비
  const tx: any = {
    TransactionType: "Payment",
    Account: admin.address,
    Destination: user.address,
    Amount: "1000000", // 1 XRP
  }

  const prepared = await client.autofill(tx)

  // 2. 멀티시그용 설정
  prepared.SigningPubKey = "" // 멀티시그 필수: 단일 서명 아님을 표시
  const baseFee = Number(prepared.Fee)
  prepared.Fee = String(baseFee * (1 + 2)) // Fee = baseFee × (1 + 서명자 수)

  console.log("=== 멀티시그 서명 ===")
  console.log(`Base Fee: ${baseFee}, Multisig Fee: ${prepared.Fee} (×3)`)

  try {
    // 3. 각 서명자가 독립적으로 서명 (multisign=true)
    const sig1 = user.sign(prepared, true)
    console.log(`Signer 1 (USER): 서명 완료`)

    const sig2 = signer2.sign(prepared, true)
    console.log(`Signer 2: 서명 완료`)

    // 4. 서명 합치기
    const combined = multisign([sig1.tx_blob, sig2.tx_blob])
    console.log(`서명 결합 완료 → 제출\n`)

    // 5. 제출
    const result = await client.submitAndWait(combined)
    console.log(JSON.stringify(result, null, 2))
    return result
  } finally {
    await client.disconnect()
  }
}

if (require.main === module) {
  multiSignTx().catch(e => { console.error(e); process.exit(1) })
}
