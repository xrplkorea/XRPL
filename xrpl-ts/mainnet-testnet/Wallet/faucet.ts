import dotenv from "dotenv"
import path from "path"
import { Client, Wallet } from "xrpl"

dotenv.config({ path: path.join(__dirname, "../../.env") })

export async function faucetAll() {
  const client = new Client("wss://s.altnet.rippletest.net:51233")
  await client.connect()

  try {
    // Admin
    if (process.env.ADMIN_SEED) {
      const adminWallet = Wallet.fromSeed(process.env.ADMIN_SEED.trim())
      await client.fundWallet(adminWallet)
      console.log(`✅ ADMIN (${adminWallet.address}) 계정 faucet 완료`)
    } else {
      console.warn("⚠️ ADMIN_SEED 환경변수 없음")
    }

    // User
    if (process.env.USER_SEED) {
      const userWallet = Wallet.fromSeed(process.env.USER_SEED.trim())
      await client.fundWallet(userWallet)
      console.log(`✅ USER (${userWallet.address}) 계정 faucet 완료`)
    } else {
      console.warn("⚠️ USER_SEED 환경변수 없음")
    }

    // User2
    if (process.env.USER2_SEED) {
      const user2Wallet = Wallet.fromSeed(process.env.USER2_SEED.trim())
      await client.fundWallet(user2Wallet)
      console.log(`✅ USER2 (${user2Wallet.address}) 계정 faucet 완료`)
    } else {
      console.warn("⚠️ USER2_SEED 환경변수 없음")
    }

  } catch (err) {
    console.error("❌ 계정 활성화 중 오류:", err)
  } finally {
    await client.disconnect()
    console.log("🔄 연결 종료")
  }
}

if (require.main === module) {
  faucetAll()
}
