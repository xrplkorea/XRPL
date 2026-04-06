import dotenv from "dotenv"
import path from "path"
import { Client, Wallet } from "xrpl"

// .env 파일 로드
dotenv.config({ path: path.join(__dirname, "../../.env") })

export async function WalletInfo() {
  const client = new Client("wss://s.altnet.rippletest.net:51233")
  await client.connect()

  try {
    const adminSeed = process.env.ADMIN_SEED
    const userSeed = process.env.USER_SEED
    const user2Seed = process.env.USER2_SEED

    if (!adminSeed || !userSeed || !user2Seed) {
      throw new Error("환경변수 ADMIN_SEED, USER_SEED, USER2_SEED 모두 필요")
    }

    const adminWallet = Wallet.fromSeed(adminSeed.trim())
    const userWallet = Wallet.fromSeed(userSeed.trim())
    const user2Wallet = Wallet.fromSeed(user2Seed.trim())

    // XRP 잔액
    const adminBalance = await client.getXrpBalance(adminWallet.address)
    const userBalance = await client.getXrpBalance(userWallet.address)
    const user2Balance = await client.getXrpBalance(user2Wallet.address)

    // 계정 정보
    const adminInfo = await client.request({ command: "account_info", account: adminWallet.address })
    const userInfo = await client.request({ command: "account_info", account: userWallet.address })
    const user2Info = await client.request({ command: "account_info", account: user2Wallet.address })

    // TrustLine
    const adminLines = await client.request({ command: "account_lines", account: adminWallet.address })
    const userLines = await client.request({ command: "account_lines", account: userWallet.address })
    const user2Lines = await client.request({ command: "account_lines", account: user2Wallet.address })

    // 출력
    console.log("📌 지갑 정보")
    console.log(
      `ADMIN: ${adminWallet.address} | Balance: ${adminBalance} XRP | Sequence: ${adminInfo.result.account_data.Sequence} | Flags: ${adminInfo.result.account_data.Flags} | RegularKey: ${adminInfo.result.account_data.RegularKey ?? "없음"}`
    )
    console.log(
      `USER: ${userWallet.address} | Balance: ${userBalance} XRP | Sequence: ${userInfo.result.account_data.Sequence} | Flags: ${userInfo.result.account_data.Flags} | RegularKey: ${userInfo.result.account_data.RegularKey ?? "없음"}`
    )
    console.log(
      `USER2: ${user2Wallet.address} | Balance: ${user2Balance} XRP | Sequence: ${user2Info.result.account_data.Sequence} | Flags: ${user2Info.result.account_data.Flags} | RegularKey: ${user2Info.result.account_data.RegularKey ?? "없음"}`
    )

    console.log(
      `TrustLines - ADMIN: ${adminLines.result.lines.length}, USER: ${userLines.result.lines.length}, USER2: ${user2Lines.result.lines.length}`
    )
    const userMPT = await client.request({
      command: "account_objects",
      account: userWallet.address,
      type: "mptoken"  // LedgerEntryType = "MPToken"
    })
    
    console.log("USER MPT Objects:", userMPT.result.account_objects)
    console.log("📌 TrustLine 상세")
console.log("ADMIN:")
adminLines.result.lines.forEach((line: any, i: number) => {
  console.log(
    `  [${i + 1}] issuer=${line.account}, currency=${line.currency}, balance=${line.balance}, limit=${line.limit}`
  )
})

console.log("USER:")
userLines.result.lines.forEach((line: any, i: number) => {
  console.log(
    `  [${i + 1}] issuer=${line.account}, currency=${line.currency}, balance=${line.balance}, limit=${line.limit}`
  )
})

console.log("USER2:")
user2Lines.result.lines.forEach((line: any, i: number) => {
  console.log(
    `  [${i + 1}] issuer=${line.account}, currency=${line.currency}, balance=${line.balance}, limit=${line.limit}`
  )
})

  } catch (error) {
    console.error("❌ 지갑 정보 조회 실패:", error)
  } finally {
    await client.disconnect()
    console.log("🔄 연결 종료")
  }
}

if (require.main === module) {
  WalletInfo()
}
