## SingleAssetVault
* XRPL의 **단일 자산 금고(Vault)** 기능으로, XRP 또는 IOU/MPT 자산을 풀링하여 관리하는 온체인 금고입니다.
* Lending Protocol의 대출 재원으로 사용되며, Depositor가 자산을 예치하면 Share(MPToken)를 수령합니다.

- **Owner (금고 생성자)**: Broker (ADMIN_SEED) — 금고 생성·설정·삭제 권한
- **Depositor (예치자)**: 누구나 (USER_SEED 등) — 금고에 자산 입금·출금
- **Asset**: XRP(`{ currency: "XRP" }`), IOU(`{ currency, issuer }`), MPT(`{ mpt_issuance_id }`)
- **WithdrawalPolicy**: `1` = first-come-first-serve (선착순 출금)

---

## 🎯 시나리오 실행 명령어 및 설명

### 1. 금고 생성
```bash
npx ts-node xrpl-ts/devnet-only/SingleAssetVault/VaultCreate.ts
```
* Owner가 XRP 금고를 생성 → **VaultID** (64 hex) 획득
* 옵션: `tfVaultPrivate`(0x00010000), `tfVaultShareNonTransferable`(0x00020000)

### 2. 금고 입금
```bash
npx ts-node xrpl-ts/devnet-only/SingleAssetVault/VaultDeposit.ts
```
* Depositor가 금고에 자산 입금, Share(MPToken) 수령
* `Amount`: XRP drops 문자열 또는 IOU `{ currency, issuer, value }`

### 3. 금고 설정 변경
```bash
npx ts-node xrpl-ts/devnet-only/SingleAssetVault/VaultSet.ts
```
* Owner가 금고 속성 변경 (AssetsMaximum, DomainID, Data 등)

### 4. 금고 출금
```bash
npx ts-node xrpl-ts/devnet-only/SingleAssetVault/VaultWithdraw.ts
```
* Depositor가 보유 Share만큼 자산 인출, Share 소각

### 5. 금고 자산 환수 (IOU/MPT Only)
```bash
npx ts-node xrpl-ts/devnet-only/SingleAssetVault/VaultClawback.ts
```
* Asset Issuer가 금고에서 자산을 강제 환수 (XRP 금고에서는 사용 불가)

### 6. 금고 삭제
```bash
npx ts-node xrpl-ts/devnet-only/SingleAssetVault/VaultDelete.ts
```
* Owner가 잔액 0인 금고를 삭제 (연결된 LoanBroker가 없어야 함)

---

## ✅ 예상 결과
성공 시:
* VaultCreate → Vault 객체 생성, VaultID 발급
* VaultDeposit → AssetsTotal/AssetsAvailable 증가, Depositor에게 MPToken Share 발급
* VaultWithdraw → 자산 반환, Share 소각
* VaultDelete → Vault 객체 및 관련 Account 삭제

실패 시:
* `tecHAS_OBLIGATIONS` → 연결된 LoanBroker가 있는 상태에서 삭제 시도
* `tecINSUFFICIENT_FUNDS` → 출금 요청 금액 > AssetsAvailable
* `tecNO_PERMISSION` → VaultClawback을 Asset Issuer가 아닌 계정이 시도
* `.env` 누락 → ADMIN_SEED / USER_SEED 확인 필요

---

## 🔍 추가 참고
* Lending Protocol과의 연동 플로우 → [`../LendingProtocol/loan_flow.md`](../LendingProtocol/loan_flow.md)
