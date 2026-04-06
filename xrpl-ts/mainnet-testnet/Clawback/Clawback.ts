import dotenv from "dotenv"
import path from "path"
import { Client, Wallet, Transaction } from "xrpl"

dotenv.config({ path: path.join(__dirname, "../../.env") })

async function clawback() {
  const client = new Client("wss://s.altnet.rippletest.net:51233")
  await client.connect()

  const ADMIN_SEED = process.env.ADMIN_SEED
  const USER_SEED = process.env.USER_SEED
  if (!ADMIN_SEED || !USER_SEED) throw new Error("Missing env: ADMIN_SEED, USER_SEED")

  const admin = Wallet.fromSeed(ADMIN_SEED.trim())
  const user = Wallet.fromSeed(USER_SEED.trim())

  try {
    // 선행조건: Admin 계정에 lsfAllowTrustLineClawback 플래그가 활성화되어 있어야 함
    // AccountSet + SetFlag: 16 (asfAllowTrustLineClawback)
    // ※ 이 플래그는 한번 켜면 끌 수 없고, TrustLine이 없는 상태에서만 설정 가능

    // Clawback: 발행자(Admin)가 보유자(User)로부터 IOU를 강제 회수
    const tx: Transaction = {
      TransactionType: "Clawback",
      Account: admin.address,
      Amount: {
        currency: "ABC",
        issuer: user.address,   // 회수 대상 (보유자)
        value: "100",           // 회수할 금액
      },
    }

    const prepared = await client.autofill(tx)
    const signed = admin.sign(prepared)
    const result = await client.submitAndWait(signed.tx_blob)

    console.log(JSON.stringify(result, null, 2))
  } finally {
    await client.disconnect()
  }
}

clawback()
