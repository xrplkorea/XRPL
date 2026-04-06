import { Client, Wallet } from "xrpl"
import path from "path"
import dotenv from "dotenv"

dotenv.config({ path: path.join(__dirname, "../../.env") })

/**
 * AMMSwap: Payment 트랜잭션으로 AMM 풀을 경유한 자산 교환
 * - AMM 풀과 오더북을 자동으로 경유하여 최적 가격 경로 선택
 * - Destination을 자기 자신으로 설정하여 스왑 결과를 본인 지갑에 받음
 */
export async function AMMSwap() {
  const client = new Client("wss://s.altnet.rippletest.net:51233")
  await client.connect()

  const USER_SEED = process.env.USER_SEED
  const ADMIN_SEED = process.env.ADMIN_SEED
  if (!USER_SEED || !ADMIN_SEED) throw new Error("Missing env: USER_SEED, ADMIN_SEED")

  const user = Wallet.fromSeed(USER_SEED.trim())
  const admin = Wallet.fromSeed(ADMIN_SEED.trim())

  // USER가 XRP를 지불하고 ABC(IOU)를 받는 스왑
  // AMM 경유 self-payment: Paths 지정 필요
  const tx: any = {
    TransactionType: "Payment",
    Account: user.address,
    Destination: user.address, // 자기 자신 (스왑)
    Amount: {
      currency: "ABC",
      issuer: admin.address,
      value: "1" // 받고 싶은 ABC 수량
    },
    SendMax: "5000000", // 최대 5 XRP 지불 (drops)
    Paths: [[{ currency: "ABC", issuer: admin.address }]],
    Flags: 0x00020000 // tfPartialPayment
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
  AMMSwap().catch(e => { console.error(e); process.exit(1) })
}
