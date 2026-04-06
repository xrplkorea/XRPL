import { Client, Wallet } from "xrpl"
import path from "path"
import dotenv from "dotenv"

dotenv.config({ path: path.join(__dirname, "../../.env") })

/**
 * AMM 사전 준비 스크립트
 * AMM 풀에 IOU를 사용하려면 아래 3가지 선행 조건이 필요합니다:
 * 1. Issuer(ADMIN)에 DefaultRipple 활성화 — IOU가 AMM을 경유해 흐르기 위해 필수
 * 2. LP(USER) → Issuer(ADMIN) TrustLine 설정
 * 3. Issuer(ADMIN) → LP(USER) IOU 전송
 */
async function setup() {
  const client = new Client("wss://s.altnet.rippletest.net:51233")
  await client.connect()

  const admin = Wallet.fromSeed(process.env.ADMIN_SEED!.trim())
  const user = Wallet.fromSeed(process.env.USER_SEED!.trim())

  console.log("ADMIN (Issuer):", admin.address)
  console.log("USER (LP):", user.address)

  // 1. ADMIN에 DefaultRipple 플래그 설정
  const acctTx: any = {
    TransactionType: "AccountSet",
    Account: admin.address,
    SetFlag: 8 // asfDefaultRipple
  }
  const p0 = await client.autofill(acctTx)
  const s0 = admin.sign(p0)
  const r0 = await client.submitAndWait(s0.tx_blob)
  console.log("1. DefaultRipple:", (r0.result.meta as any).TransactionResult)

  // 2. USER → ADMIN TrustLine for ABC
  const trustTx: any = {
    TransactionType: "TrustSet",
    Account: user.address,
    LimitAmount: { currency: "ABC", issuer: admin.address, value: "1000" }
  }
  const p1 = await client.autofill(trustTx)
  const s1 = user.sign(p1)
  const r1 = await client.submitAndWait(s1.tx_blob)
  console.log("2. TrustSet:", (r1.result.meta as any).TransactionResult)

  // 3. ADMIN → USER: 100 ABC IOU 발행
  const payTx: any = {
    TransactionType: "Payment",
    Account: admin.address,
    Destination: user.address,
    Amount: { currency: "ABC", issuer: admin.address, value: "100" }
  }
  const p2 = await client.autofill(payTx)
  const s2 = admin.sign(p2)
  const r2 = await client.submitAndWait(s2.tx_blob)
  console.log("3. Payment:", (r2.result.meta as any).TransactionResult)

  await client.disconnect()
}

if (require.main === module) {
  setup().catch(e => { console.error(e); process.exit(1) })
}
