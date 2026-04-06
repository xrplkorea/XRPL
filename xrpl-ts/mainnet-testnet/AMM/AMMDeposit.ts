import { Client, Wallet } from "xrpl"
import path from "path"
import dotenv from "dotenv"

dotenv.config({ path: path.join(__dirname, "../../.env") })

/**
 * AMMDeposit 트랜잭션: 기존 AMM 풀에 유동성 추가
 * - 두 자산 비율에 맞춰 추가하거나, 단일 자산만 추가할 수도 있음
 */
export async function AMMDeposit() {
  const client = new Client("wss://s.altnet.rippletest.net:51233")
  await client.connect()

  const ADMIN_SEED = process.env.ADMIN_SEED
  const USER_SEED = process.env.USER_SEED
  if (!ADMIN_SEED || !USER_SEED) throw new Error("Missing env: ADMIN_SEED, USER_SEED")

  const admin = Wallet.fromSeed(ADMIN_SEED.trim())
  const user = Wallet.fromSeed(USER_SEED.trim())

  // USER가 XRP/ABC 풀에 유동성 추가 (두 자산 비율 맞춰 예치)
  const tx: any = {
    TransactionType: "AMMDeposit",
    Account: user.address,
    Asset: { currency: "XRP" },
    Asset2: { currency: "ABC", issuer: admin.address },
    Amount: "5000000", // 5 XRP (drops)
    Amount2: {
      currency: "ABC",
      issuer: admin.address,
      value: "5"
    },
    Flags: 0x00100000 // tfTwoAsset
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
  AMMDeposit().catch(e => { console.error(e); process.exit(1) })
}
