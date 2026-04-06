# XRPL Korea Financial Innovation Program — Sample Code

> XRPL 핵심 기능별 시나리오 기반 TypeScript 예제 코드 모음입니다.
> **Testnet / Mainnet**에서 동작하는 기능과 **Devnet 전용** 기능이 분리되어 있습니다.

---

## 🚀 Quickstart

```bash
# 1) 레포 클론
git clone https://github.com/jun637/XRPL.git
cd XRPL

# 2) 의존성 설치
cd xrpl-ts
npm install

# 3) .env 설정
cp ../.env.example ../.env
# .env 파일에 지갑 시드를 입력하세요 (아래 "지갑 생성" 참고)

# 4) Testnet 지갑 생성
npx ts-node mainnet-testnet/Wallet/createNewWallet.ts
# 출력되는 시드 값을 .env에 저장

# 5) Faucet으로 테스트 XRP 충전
npx ts-node mainnet-testnet/Wallet/faucet.ts

# 6) 지갑 정보 조회
npx ts-node mainnet-testnet/Wallet/WalletInfo.ts
```

---

## 🗂️ 디렉토리 구조

```
xrpl-ts/
├── mainnet-testnet/          # Mainnet & Testnet에서 사용 가능한 기능
│   ├── Wallet/               # 지갑 생성/관리
│   ├── Payment/              # XRP/IOU 송금
│   ├── TrustSet/             # 신뢰선 설정
│   ├── AccountSet/           # 계정 옵션 설정
│   ├── Clawback/             # IOU 강제 회수
│   ├── Credential/           # Credential 발급/검증
│   ├── PermissionedDEX/      # 권한 기반 DEX
│   ├── PermissionedDomains/  # Domain 기반 권한 관리
│   ├── TokenEscrow/          # 에스크로 (IOU/MPT)
│   ├── MPToken/              # Multi-Purpose Tokens
│   ├── AMM/                  # 자동화 시장 메이커
│   ├── NFToken/              # NFT
│   ├── DID/                  # 분산 식별자
│   ├── DEX/                  # 오더북 DEX
│   ├── Check/                # 수표
│   ├── PaymentChannel/       # 결제 채널
│   ├── PriceOracle/          # 가격 오라클
│   ├── Multisig/             # 멀티시그
│   └── Server/               # 서버 정보 확인
│
├── devnet-only/              # Devnet에서만 사용 가능한 기능
│   ├── Batch/                # 배치 트랜잭션
│   ├── LendingProtocol/      # 대출 프로토콜
│   └── SingleAssetVault/     # 단일 자산 볼트
│
├── package.json
└── tsconfig.json
```

---

## 📂 폴더별 README

### Mainnet & Testnet
- [Wallet](./xrpl-ts/mainnet-testnet/Wallet/README.md) — 지갑 생성/관리
- [Payment](./xrpl-ts/mainnet-testnet/Payment/README.md) — XRP/IOU 송금
- [TrustSet](./xrpl-ts/mainnet-testnet/TrustSet/README.md) — 신뢰선 설정
- [AccountSet](./xrpl-ts/mainnet-testnet/AccountSet/README.md) — 계정 옵션
- [Clawback](./xrpl-ts/mainnet-testnet/Clawback/README.md) — IOU 강제 회수
- [Credential](./xrpl-ts/mainnet-testnet/Credential/README.md) — Credential 발급/검증
- [PermissionedDEX](./xrpl-ts/mainnet-testnet/PermissionedDEX/README.md) — 권한 기반 DEX
- [PermissionedDomains](./xrpl-ts/mainnet-testnet/PermissionedDomains/README.md) — Domain 기반 권한 관리
- [TokenEscrow](./xrpl-ts/mainnet-testnet/TokenEscrow/README.md) — 에스크로
- [MPToken](./xrpl-ts/mainnet-testnet/MPToken/README.md) — Multi-Purpose Tokens
- [AMM](./xrpl-ts/mainnet-testnet/AMM/README.md) — 자동화 시장 메이커
- [NFToken](./xrpl-ts/mainnet-testnet/NFToken/README.md) — NFT
- [DID](./xrpl-ts/mainnet-testnet/DID/README.md) — 분산 식별자
- [DEX](./xrpl-ts/mainnet-testnet/DEX/README.md) — 오더북 DEX
- [Check](./xrpl-ts/mainnet-testnet/Check/README.md) — 수표
- [PaymentChannel](./xrpl-ts/mainnet-testnet/PaymentChannel/README.md) — 결제 채널
- [PriceOracle](./xrpl-ts/mainnet-testnet/PriceOracle/README.md) — 가격 오라클
- [Multisig](./xrpl-ts/mainnet-testnet/Multisig/README.md) — 멀티시그
- [Server](./xrpl-ts/mainnet-testnet/Server/README.md) — 서버 정보

### Devnet Only
- [Batch](./xrpl-ts/devnet-only/Batch/README.md) — 배치 트랜잭션
- [LendingProtocol](./xrpl-ts/devnet-only/LendingProtocol/README.md) — 대출 프로토콜
- [SingleAssetVault](./xrpl-ts/devnet-only/SingleAssetVault/README.md) — 단일 자산 볼트

---

## 🔍 XRPL Explorer

| 네트워크 | Explorer |
|----------|----------|
| Testnet  | https://testnet.xrpl.org/ |
| Mainnet  | https://livenet.xrpl.org/ |
| Devnet   | https://devnet.xrpl.org/ |

---

## 🌐 네트워크 / 버전

| 항목 | 값 |
|------|---|
| 네트워크 (mainnet-testnet) | XRPL Testnet (`wss://s.altnet.rippletest.net:51233`) |
| 네트워크 (devnet-only) | XRPL Devnet (`wss://s.devnet.rippletest.net:51233`) |
| xrpl.js | 4.6.0 |
| ripple-binary-codec | 2.7.0 |
| Node.js | LTS 권장 |
