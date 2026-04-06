## Check (수표)

**XRPL 온체인 수표 — 발행자가 금액을 약속하고, 수취인이 원할 때 현금화하는 지연 결제 기능.**

일반 Payment가 즉시 송금이라면, Check는 "나중에 찾아가세요"라는 약속입니다. 발행 시점에는 자금이 이동하지 않고, 수취인이 `CheckCash`로 현금화할 때 비로소 송금됩니다. 현금화 전이라면 발행자나 수취인 모두 취소할 수 있습니다.

### XRPL 결제 수단 비교

| | **Payment** | **PaymentChannel** | **Escrow** | **Check** |
|---|---|---|---|---|
| 한줄 요약 | 즉시 송금 | 오프체인 마이크로페이먼트 | 조건부 예치 | **지연 결제 (수표)** |
| 자금 이동 시점 | 즉시 | Claim 할 때 | Finish 할 때 | **Cash 할 때** |
| 자금 잠김? | X (바로 이동) | O (채널에 예치) | O (에스크로에 예치) | **X (발행자 잔고에 그대로)** |
| 취소 가능? | X (이미 전송됨) | 채널 종료로 회수 | 조건부 가능 | **O (현금화 전이면 자유롭게)** |
| 누가 실행? | 보내는 사람 | 받는 사람 (Claim) | 누구나 (Finish) | **받는 사람 (Cash)** |
| 주 용도 | 일반 송금 | 스트리밍 결제, API 과금 | 조건부 거래, 시간 잠금 | **청구서, 후불 결제** |

### 역할

- **ADMIN (ADMIN_SEED)**: 수표 발행자 (Sender)
- **USER (USER_SEED)**: 수표 수취인 (Destination)

### 라이프사이클

```
CheckCreate → CheckCash (현금화) 또는 CheckCancel (취소)
```

---

## 🎯 시나리오 실행 명령어 및 설명

### 1. 수표 생성

```bash
npx ts-node xrpl-ts/mainnet-testnet/Check/CheckCreate.ts
```

* ADMIN이 USER에게 10 XRP 수표 발행
* `SendMax`: 최대 인출 가능 금액 (XRP 또는 IOU)
* 이 시점에서는 자금 이동 없음 — 약속만 기록
* 결과에서 **Check ID**를 확인하여 나머지 스크립트 상수에 복사

### 2. 수표 현금화

```bash
npx ts-node xrpl-ts/mainnet-testnet/Check/CheckCash.ts
```

* USER(수취인)가 수표를 현금화 → 10 XRP 수령
* `Amount`: 정확한 금액 수령 (SendMax 이하)
* `DeliverMin`: 최소 금액 지정 (IOU 부분 현금화 시 유용)
* Amount와 DeliverMin 중 **하나만** 지정
* `CHECK_ID` 상수에 CheckCreate 결과의 Check ID를 먼저 입력

### 3. 수표 취소

```bash
npx ts-node xrpl-ts/mainnet-testnet/Check/CheckCancel.ts
```

* 발행자(ADMIN) 또는 수취인(USER) 모두 취소 가능
* 만료(Expiration) 지난 수표는 **누구나** 취소 가능
* 이미 현금화된 수표는 ledger에 없으므로 취소 불가
* `CHECK_ID` 상수에 취소할 Check ID를 먼저 입력

---

## ✅ 예상 결과

성공 시:
* **CheckCreate** → `tesSUCCESS`, Check ID 출력
* **CheckCash** → `tesSUCCESS`, 수취인에게 자금 이체
* **CheckCancel** → `tesSUCCESS`, Check 객체 삭제

실패 시:
* `tecNO_ENTRY` → 존재하지 않는 Check ID (이미 현금화/취소됨)
* `tecNO_PERMISSION` → 수취인이 아닌 계정이 CheckCash 시도
* `tecINSUFFICIENT_FUNDS` → 발행자 잔고 부족 (Cash 시점에 검증)
* `tecEXPIRED` → 만료된 수표를 현금화 시도
* `.env` 누락 → ADMIN_SEED / USER_SEED 확인 필요

---

## 🔍 추가 참고

* **자금 검증은 Cash 시점**: Create 시에는 잔고 확인 안 함 → Cash 할 때 잔고 부족이면 실패
* **Check vs Escrow**: Escrow는 자금을 잠그지만, Check는 잠그지 않음 (발행자가 잔고를 자유롭게 사용 가능)
* **IOU 수표**: SendMax에 IOU 금액 지정 가능 (수취인에게 TrustLine 필요)
* **Expiration**: Ripple epoch 기준 만료 시간 (설정하지 않으면 영구 유효)
* **Owner reserve**: Check 생성 시 0.2 XRP 잠김, 현금화/취소 시 반환
* XRPL 공식 문서: [Checks](https://xrpl.org/docs/concepts/payment-types/checks)
