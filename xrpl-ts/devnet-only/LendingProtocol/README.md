## LendingProtocol
* XRPL의 **온체인 대출 프로토콜**로, Vault(금고) 기반 자금으로 Broker가 Borrower에게 대출을 실행하는 기능입니다.
* LoanSet은 **Borrower + Broker 듀얼 서명**이 필요하며, 상환·부도·손상 처리 등 대출 라이프사이클 전체를 온체인에서 관리합니다.

- **사전 조건**: SingleAssetVault의 `VaultCreate` + `VaultDeposit`으로 금고 및 재원이 준비되어 있어야 합니다
- **주요 주체**: Broker(ADMIN_SEED), Borrower(USER_SEED)
- **듀얼 서명**: LoanSet만 Borrower 서명 + Broker CounterpartySignature 필요 (나머지는 단일 서명)
- **STNumber 버그**: `ripple-binary-codec@2.6.0`의 `Number` 타입 정규화 버그로 LoanSet 등에서 Invalid signature 발생 → `st-number.js` 패치 필요 (`github-issue.md` 참고)

---

## 🎯 시나리오 실행 명령어 및 설명

### 1. 브로커 등록
```bash
npx ts-node xrpl-ts/devnet-only/LendingProtocol/LoanBrokerSet.ts
```
* Broker가 Vault에 연결된 LoanBroker 객체를 온체인에 생성 → **LoanBrokerID** 획득

### 2. 커버 자본 입금 (권장)
```bash
npx ts-node xrpl-ts/devnet-only/LendingProtocol/LoanBrokerCoverDeposit.ts
```
* Broker가 First-Loss Capital을 입금하여 부실 시 손실 흡수 버퍼 구축

### 3. 대출 생성 (듀얼 서명)
```bash
npx ts-node xrpl-ts/devnet-only/LendingProtocol/LoanSet.ts
```
* Borrower(Account)와 Broker(Counterparty) 듀얼 서명으로 대출 실행
* `PrincipalRequested`: 대출 원금, `PaymentInterval`/`GracePeriod`: 상환 주기 및 유예 기간 (기본값 60초, 테스트 시 충분히 설정)

### 4. 대출 상환
```bash
npx ts-node xrpl-ts/devnet-only/LendingProtocol/LoanPay.ts
```
* Borrower가 `LoanID` 지정 후 `PeriodicPayment` 이상 금액을 상환

### 5. 대출 관리 (부도/손상 처리)
```bash
npx ts-node xrpl-ts/devnet-only/LendingProtocol/LoanManage.ts
```
* Broker가 `tfLoanDefault`(0x00010000)로 부도 처리, `tfLoanImpair`(0x00020000)로 손상 처리

### 6. 대출 삭제
```bash
npx ts-node xrpl-ts/devnet-only/LendingProtocol/LoanDelete.ts
```
* 미상환 잔액이 0인 Loan 객체 삭제 (상환 완료 또는 Default 처리 후)

### 7. 커버 자본 회수
```bash
npx ts-node xrpl-ts/devnet-only/LendingProtocol/LoanBrokerCoverWithdraw.ts
```
* Broker가 CoverAvailable에서 자본 회수

### 8. 커버 자본 환수 (IOU/MPT Only)
```bash
npx ts-node xrpl-ts/devnet-only/LendingProtocol/LoanBrokerCoverClawback.ts
```
* Asset Issuer가 Broker의 Cover를 강제 환수 (XRP 대출에서는 사용 불가)

### 9. 브로커 삭제
```bash
npx ts-node xrpl-ts/devnet-only/LendingProtocol/LoanBrokerDelete.ts
```
* 소속 Loan이 전부 삭제된 후 LoanBroker 객체 삭제, 잔여 Cover 자동 반환

---

## ✅ 예상 결과
성공 시:
* 각 트랜잭션 실행 → `tesSUCCESS` 확인
* LoanSet → Loan 객체 생성, Borrower에게 원금 지급, Vault AssetsAvailable 감소
* LoanPay → PrincipalOutstanding 감소, Vault로 상환금 복귀
* LoanManage (Default) → PrincipalOutstanding 상각, Vault AssetsTotal 손실 반영

실패 시:
* `tecINSUFFICIENT_FUNDS` → Vault 잔액 부족, VaultDeposit으로 재원 추가
* `tecINSUFFICIENT_PAYMENT` → LoanPay 금액이 PeriodicPayment 미만
* `tecEXPIRED` → NextPaymentDueDate + GracePeriod 초과, LoanManage(Default)로 처리
* `tecHAS_OBLIGATIONS` → 미상환 잔액 있는 Loan/Broker 삭제 시도, 상환 또는 Default 선행 필요
* `Invalid signature` → STNumber 버그, `st-number.js` 패치 필요 (`github-issue.md` 참고)

---

## 🔍 추가 참고
* 전체 라이프사이클 도식 / 시나리오별 플로우 / 필드 상세 → [`loan_flow.md`](./loan_flow.md)
* STNumber 버그 상세 및 패치 방법 → [`github-issue.md`](./github-issue.md)
