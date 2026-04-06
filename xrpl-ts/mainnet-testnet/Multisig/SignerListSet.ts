import { Client, Wallet } from "xrpl"
import path from "path"
import dotenv from "dotenv"

dotenv.config({ path: path.join(__dirname, "../../.env") })

/**
 * SignerListSet: 계정에 멀티시그 서명자 목록(SignerList) 등록
 * - ADMIN 계정에 2-of-3 멀티시그 설정
 * - Signer 1 (USER): weight 2 — 핵심 서명자
 * - Signer 2 (생성): weight 1 — 보조 서명자
 * - Signer 3 (생성): weight 1 — 보조 서명자
 * - SignerQuorum: 3 → USER(2) + 아무나 1명(1) = 3 충족
 */
export async function signerListSet() {
  const client = new Client("wss://s.altnet.rippletest.net:51233")
  await client.connect()

  const ADMIN_SEED = process.env.ADMIN_SEED
  const USER_SEED = process.env.USER_SEED
  if (!ADMIN_SEED || !USER_SEED) throw new Error("Missing env: ADMIN_SEED, USER_SEED")

  const admin = Wallet.fromSeed(ADMIN_SEED.trim())
  const user = Wallet.fromSeed(USER_SEED.trim())

  // 보조 서명자 2명 생성
  const signer2 = Wallet.generate()
  const signer3 = Wallet.generate()

  console.log("=== 서명자 정보 ===")
  console.log(`Signer 1 (USER):    ${user.address} (weight 2)`)
  console.log(`Signer 2 (생성):    ${signer2.address} (weight 1)`)
  console.log(`  → Signer 2 Seed:  ${signer2.seed}`)
  console.log(`Signer 3 (생성):    ${signer3.address} (weight 1)`)
  console.log(`  → Signer 3 Seed:  ${signer3.seed}`)
  console.log(`Quorum: 3\n`)
  console.log("⚠️  Signer 2/3 Seed를 MultiSignTx.ts에 복사하세요!")
  console.log("==================\n")

  const tx: any = {
    TransactionType: "SignerListSet",
    Account: admin.address,
    SignerQuorum: 3,
    SignerEntries: [
      { SignerEntry: { Account: user.address, SignerWeight: 2 } },
      { SignerEntry: { Account: signer2.address, SignerWeight: 1 } },
      { SignerEntry: { Account: signer3.address, SignerWeight: 1 } },
    ],
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
  signerListSet().catch(e => { console.error(e); process.exit(1) })
}
