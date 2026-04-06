# AMM 아키텍처 이해

## 핵심 개념

AMM(Automated Market Maker)은 **오더북 없이** 두 자산 간 교환을 가능하게 하는 온체인 유동성 풀입니다.
기존 DEX가 매수/매도 주문을 매칭하는 방식이라면, AMM은 **수학 공식(CPMM: x × y = k)**으로 가격을 자동 결정합니다.

```
┌──────────────────────────────────────────────┐
│                 AMM Pool                      │
│                                               │
│   XRP (Asset A)  ←→  ABC IOU (Asset B)       │
│   10,000,000 drops     10 ABC                │
│                                               │
│   가격 = Asset A / Asset B = 1,000,000 XRP/ABC│
│   (1 ABC ≈ 1 XRP)                            │
│                                               │
│   LP Token: 풀 지분을 나타내는 토큰            │
│   TradingFee: 스왑 시 LP에게 돌아가는 수수료   │
└──────────────────────────────────────────────┘
```

## 역할 구분

```
ADMIN (ADMIN_SEED) = IOU 발행자 + 풀 생성자 + LP
USER  (USER_SEED)  = LP (유동성 공급자) + 트레이더
AMM Account        = 자동 생성되는 풀 전용 계정 (직접 제어 불가)
```

- **IOU 발행자(Issuer)**: ABC 토큰을 발행. DefaultRipple 필수
- **LP(Liquidity Provider)**: 풀에 자산을 예치하고 LP Token을 받음. 수수료 수익 발생
- **트레이더**: 풀을 경유해 자산 교환 (Swap)

## 라이프사이클

```
[사전 준비]
  _setup.ts: DefaultRipple → TrustLine → IOU 발행
      ↓
[풀 생성]
  AMMCreate: ADMIN이 XRP + ABC를 예치 → AMM 풀 생성 → LP Token 발급
      ↓
[풀 조회]
  getAMMinfo: 풀 상태 확인 (잔액, TradingFee, LP Token currency/issuer)
      ↓
[유동성 추가]
  AMMDeposit: USER가 XRP + ABC를 추가 예치 → LP Token 수령
      ↓
[스왑]
  AMMSwap: USER가 XRP → ABC 교환 (Payment TX로 AMM 경유)
      ↓
[거버넌스]
  AMMVote: LP Token 보유자가 TradingFee 투표 (가중평균 적용)
  AMMBid: LP Token으로 경매 슬롯 입찰 → 24시간 수수료 할인
      ↓
[유동성 제거]
  AMMWithdraw: LP Token 반환 → 자산(XRP + ABC) 수령
      ↓
[풀 삭제]
  AMMDelete: 잔여 LP Token이 0일 때만 가능 (보통 자동 삭제됨)
```

## 핵심 메커니즘

### 1. 가격 결정: CPMM (Constant Product)

```
x × y = k (상수)

예: XRP 10,000,000 × ABC 10 = 100,000,000

→ 누군가 1 XRP를 넣으면?
   10,000,001 × y = 100,000,000
   y = 9.99999900...
   → 약 0.0000001 ABC를 받음 (+ 수수료 차감)
```

풀에 유동성이 많을수록 슬리피지(가격 변동)가 작아집니다.

### 2. LP Token = 풀 지분

- Create 시 초기 LP Token = `sqrt(Amount × Amount2)` = `sqrt(10M × 10)` = 10,000
- Deposit 시 비율에 따라 LP Token 추가 발급
- Withdraw 시 LP Token 소각, 비율에 따라 자산 반환
- **LP Token currency**: 40자 hex 해시 (풀마다 고유)
- **LP Token issuer**: AMM Account 주소

### 3. TradingFee 거버넌스

```
TradingFee 범위: 0 ~ 1000 (0.001% ~ 1%)

투표 결과 = LP Token 보유량 가중평균

예: ADMIN(LP 10,000, Fee 30) + USER(LP 5,000, Fee 25)
  = (30 × 66667 + 25 × 33333) / 100000 ≈ 28
```

### 4. Auction Slot (수수료 할인)

- LP Token으로 입찰 → 최고 입찰자가 슬롯 획득
- 슬롯 보유자: 24시간 동안 `TradingFee / 10`의 할인 수수료로 스왑 가능
- 입찰에 사용된 LP Token은 풀에 소각됨

### 5. Swap = Payment 트랜잭션

AMM에 별도 "Swap" 트랜잭션은 없습니다. 기존 **Payment**를 사용합니다:

```typescript
{
  TransactionType: "Payment",
  Account: user.address,
  Destination: user.address,  // 자기 자신 = 스왑
  Amount: { currency: "ABC", issuer: admin.address, value: "1" },
  SendMax: "5000000",         // 최대 5 XRP 지불
  Paths: [[{ currency: "ABC", issuer: admin.address }]],
  Flags: 0x00020000           // tfPartialPayment
}
```

- **Destination = 자기 자신**: XRP를 내고 ABC를 받는 자기 교환
- **Paths**: AMM 경유 경로 지정 (없으면 `tecPATH_DRY`)
- **tfPartialPayment**: 풀 유동성에 따라 부분 충족 허용

## 주의사항 & Gotchas

### DefaultRipple 필수
IOU 발행자에 `DefaultRipple` 플래그가 없으면 `terNO_RIPPLE` 에러.
**반드시 TrustLine 설정 전에 활성화**해야 합니다. 기존 TrustLine이 이미 있다면
Issuer가 `TrustSet + tfClearNoRipple`로 기존 라인의 NoRipple을 해제해야 합니다.

### AMMCreate Fee = 200,000 drops (특별 수수료)
일반 트랜잭션은 수수료가 1~12 drops이지만, AMMCreate는 **200,000 drops (0.2 XRP)**가 부과됩니다.
AMM 풀 생성 시 AMM 객체 + AMM Account + LP Token trust line 등 다수의 ledger entry가 만들어지므로,
무분별한 풀 생성을 방지하기 위한 **안티 스팸** 목적입니다. autofill이 자동 계산하므로 별도 지정 불필요.

### AMMDelete는 보통 불필요
마지막 LP가 `tfWithdrawAll`로 인출하면 AMM이 **자동 삭제**됩니다.
AMMDelete는 라운딩으로 인해 극소량 잔여분이 남은 edge case에서만 필요합니다.

### AMMClawback 전제조건
- Issuer 계정에 `lsfAllowTrustLineClawback` 플래그 필요
- 이 플래그는 **계정에 TrustLine이 없을 때만** 설정 가능
- 한 번 설정하면 해제 불가 → 계정 생성 초기에 결정해야 함

### LP Token currency는 풀마다 다름
`getAMMinfo`로 조회한 LP Token의 currency(40자 hex)와 issuer(AMM Account)를
AMMBid 등에서 반드시 사용해야 합니다.
