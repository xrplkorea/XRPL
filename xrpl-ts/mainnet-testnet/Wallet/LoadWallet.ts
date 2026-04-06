import dotenv from "dotenv"
import path from "path"
import { Client, Wallet } from "xrpl"

// .env 로드 (상위 폴더 기준)
dotenv.config({ path: path.join(__dirname, "../../.env") })

async function loadWallet() {
  const client = new Client("wss://s.altnet.rippletest.net:51233")
  await client.connect()

  try {
    // 1. 환경변수 확인
    const ADMIN_SEED = process.env.ADMIN_SEED?.trim()
    const USER_SEED  = process.env.USER_SEED?.trim()
    const USER2_SEED = process.env.USER2_SEED?.trim()

    if (!ADMIN_SEED || !USER_SEED || !USER2_SEED) {
      throw new Error("환경변수 ADMIN_SEED, USER_SEED, USER2_SEED가 모두 필요합니다.")
    }

    // 2. Wallet 생성
    const adminWallet = Wallet.fromSeed(ADMIN_SEED)
    const userWallet  = Wallet.fromSeed(USER_SEED)
    const user2Wallet = Wallet.fromSeed(USER2_SEED)

    // 3. 출력
    console.log(`Admin: ${adminWallet.address} | Seed: ${adminWallet.seed}`)
    console.log(`User:  ${userWallet.address} | Seed: ${userWallet.seed}`)
    console.log(`User2: ${user2Wallet.address} | Seed: ${user2Wallet.seed}`)

    return { admin: adminWallet, user: userWallet, user2: user2Wallet }
  } catch (err) {
    console.error("❌ 지갑 로드 실패:", err)
    throw err
  } finally {
    await client.disconnect()
    console.log("🔄 연결 종료")
  }
}

if (require.main === module) {
  loadWallet()
}
