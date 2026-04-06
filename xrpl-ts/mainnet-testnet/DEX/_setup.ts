import { Client, Wallet } from "xrpl"
import path from "path"
import dotenv from "dotenv"

dotenv.config({ path: path.join(__dirname, "../../.env") })

/**
 * DEX 사전 설정: DefaultRipple → TrustLine → IOU 발행
 * - ADMIN: IOU 발행자 (ABC)
 * - USER: 트레이더 (ABC를 받아서 DEX에서 거래)
 */
export async function setup() {
  const client = new Client("wss://s.altnet.rippletest.net:51233")
  await client.connect()

  const ADMIN_SEED = process.env.ADMIN_SEED
  const USER_SEED = process.env.USER_SEED
  if (!ADMIN_SEED || !USER_SEED) throw new Error("Missing env: ADMIN_SEED, USER_SEED")

  const admin = Wallet.fromSeed(ADMIN_SEED.trim())
  const user = Wallet.fromSeed(USER_SEED.trim())

  try {
    // 1. DefaultRipple 활성화 (ADMIN — IOU 발행자)
    console.log("=== 1. DefaultRipple 활성화 ===")
    const accountSet: any = {
      TransactionType: "AccountSet",
      Account: admin.address,
      SetFlag: 8, // asfDefaultRipple
    }
    const prep1 = await client.autofill(accountSet)
    const signed1 = admin.sign(prep1)
    const res1 = await client.submitAndWait(signed1.tx_blob)
    console.log("DefaultRipple:", (res1.result.meta as any)?.TransactionResult)

    // 2. USER → ADMIN IOU TrustLine 설정
    console.log("\n=== 2. TrustLine 설정 (USER → ABC) ===")
    const trustSet: any = {
      TransactionType: "TrustSet",
      Account: user.address,
      LimitAmount: {
        currency: "ABC",
        issuer: admin.address,
        value: "10000",
      },
    }
    const prep2 = await client.autofill(trustSet)
    const signed2 = user.sign(prep2)
    const res2 = await client.submitAndWait(signed2.tx_blob)
    console.log("TrustSet:", (res2.result.meta as any)?.TransactionResult)

    // 3. ADMIN → USER IOU 전송
    console.log("\n=== 3. IOU 발행 (ADMIN → USER: 100 ABC) ===")
    const payment: any = {
      TransactionType: "Payment",
      Account: admin.address,
      Destination: user.address,
      Amount: {
        currency: "ABC",
        issuer: admin.address,
        value: "100",
      },
    }
    const prep3 = await client.autofill(payment)
    const signed3 = admin.sign(prep3)
    const res3 = await client.submitAndWait(signed3.tx_blob)
    console.log("Payment:", (res3.result.meta as any)?.TransactionResult)
  } finally {
    await client.disconnect()
  }
}

if (require.main === module) {
  setup().catch(e => { console.error(e); process.exit(1) })
}
