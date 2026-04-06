## AMM (Automated Market Maker)

**오더북 없이 수학 공식(x × y = k)으로 가격을 자동 결정하는 온체인 유동성 풀.**

유동성 공급자(LP)가 두 자산을 예치하면, 트레이더가 풀을 경유해 자산을 교환할 수 있습니다.
LP는 거래 수수료 수익을, 트레이더는 즉시 교환을 얻습니다.

### 기존 DEX와 비교

| | 오더북 DEX | AMM |
|---|---------|-----|
| 가격 결정 | 매수/매도 주문 매칭 | 수학 공식 (CPMM) |
| 유동성 | 주문자가 개별 제공 | LP가 풀에 예치 |
| 거래 상대방 | 다른 트레이더 | 풀 자체 |
| 상시 유동성 | 주문이 있어야 함 | 풀에 잔액이 있으면 항상 가능 |

### 역할

- **ADMIN (ADMIN_SEED)**: IOU 발행자 + 풀 생성자 + LP
- **USER (USER_SEED)**: LP (유동성 공급) + 트레이더 (스왑)

### 라이프사이클

```
_setup → AMMCreate → getAMMinfo → AMMDeposit → AMMSwap
                                  → AMMVote → AMMBid
                                  → AMMWithdraw → AMMDelete
```

상세 아키텍처: [`amm_architecture.md`](./amm_architecture.md)

---

## 🎯 시나리오 실행 명령어 및 설명

### 0. 사전 준비 (필수)

```bash
npx ts-node xrpl-ts/mainnet-testnet/AMM/_setup.ts
```

* ADMIN에 **DefaultRipple** 활성화 (IOU가 AMM을 경유해 흐르기 위해 필수)
* USER → ADMIN TrustLine 설정 (ABC IOU)
* ADMIN → USER ABC 100 발행

### 1. AMM 풀 생성

```bash
npx ts-node xrpl-ts/mainnet-testnet/AMM/AMMCreate.ts
```

* ADMIN이 XRP 10 + ABC 10을 예치하여 AMM 풀 생성
* `TradingFee: 30` (0.03%)
* 초기 LP Token 발급 (= `sqrt(10,000,000 × 10)` = 10,000)
* 특별 수수료: 200,000 drops (일반 TX의 ~16,000배)

### 2. 풀 정보 조회

```bash
npx ts-node xrpl-ts/mainnet-testnet/AMM/getAMMinfo.ts
```

* `amm_info` RPC로 풀 상태 조회 (잔액, TradingFee, LP Token 등)
* LP Token의 **currency**(40자 hex)와 **issuer**(AMM Account)를 확인
* AMMBid 스크립트의 상수에 복사하여 사용

### 3. 유동성 추가

```bash
npx ts-node xrpl-ts/mainnet-testnet/AMM/AMMDeposit.ts
```

* USER가 XRP 5 + ABC 5를 풀에 추가 예치 (`tfTwoAsset`)
* 비율에 맞는 LP Token 수령

### 4. 스왑 (자산 교환)

```bash
npx ts-node xrpl-ts/mainnet-testnet/AMM/AMMSwap.ts
```

* USER가 XRP → ABC 교환 (Payment TX로 AMM 경유)
* `Destination: 자기 자신` = 스왑 패턴
* `Paths`: AMM 경유 경로 지정 (없으면 `tecPATH_DRY`)
* `tfPartialPayment`: 풀 유동성에 따라 부분 충족 허용

### 5. TradingFee 투표

```bash
npx ts-node xrpl-ts/mainnet-testnet/AMM/AMMVote.ts
```

* LP Token 보유자가 풀의 TradingFee에 투표
* LP Token 보유량 기준 **가중평균**으로 최종 TradingFee 결정

### 6. 경매 슬롯 입찰

```bash
npx ts-node xrpl-ts/mainnet-testnet/AMM/AMMBid.ts
```

* LP Token으로 경매 슬롯에 입찰
* 낙찰 시 **24시간 동안 수수료 할인** (TradingFee / 10)
* `LP_TOKEN_CURRENCY`, `LP_TOKEN_ISSUER` 상수를 getAMMinfo 결과에서 먼저 입력

### 7. 유동성 제거

```bash
npx ts-node xrpl-ts/mainnet-testnet/AMM/AMMWithdraw.ts
```

* ADMIN이 풀에서 **전체 유동성 인출** (`tfWithdrawAll`)
* LP Token 소각, 비율에 따라 XRP + ABC 반환

### 8. AMM 삭제

```bash
npx ts-node xrpl-ts/mainnet-testnet/AMM/AMMDelete.ts
```

* LP Token이 전혀 남지 않은 빈 풀만 삭제 가능
* 보통 마지막 LP가 `tfWithdrawAll`하면 **자동 삭제**되므로 별도 실행 불필요
* 라운딩으로 인해 극소량이 남은 edge case에서만 사용

### 9. AMMClawback (별도)

```bash
npx ts-node xrpl-ts/mainnet-testnet/AMM/AMMClawback.ts
```

* Asset Issuer가 AMM 풀에서 특정 LP의 자산을 강제 회수
* **전제조건**: Issuer에 `lsfAllowTrustLineClawback` 플래그 필요 (계정 생성 초기에만 설정 가능)
* `HOLDER` 상수에 대상 LP 주소를 먼저 입력

---

## ✅ 예상 결과

성공 시:
* **_setup** → DefaultRipple, TrustSet, Payment 모두 `tesSUCCESS`
* **AMMCreate** → 풀 생성, `tesSUCCESS`, LP Token 발급
* **getAMMinfo** → 풀 잔액, TradingFee, LP Token info 출력
* **AMMDeposit** → 유동성 추가, `tesSUCCESS`, LP Token 수령
* **AMMSwap** → `tesSUCCESS`, `delivered_amount`에 교환된 ABC 수량
* **AMMVote** → `tesSUCCESS`, TradingFee 변경 (가중평균)
* **AMMBid** → `tesSUCCESS`, AuctionSlot 낙찰
* **AMMWithdraw** → `tesSUCCESS`, 자산 반환
* **AMMDelete** → `tesSUCCESS` (빈 풀일 때만)

실패 시:
* `terNO_RIPPLE` → Issuer에 DefaultRipple 미설정 (또는 기존 TrustLine에 NoRipple 잔존)
* `tecPATH_DRY` → AMMSwap에서 Paths 미지정 또는 NoRipple 문제
* `tecAMM_EMPTY_POOL` → 빈 풀에 Deposit/Swap 시도
* `tecAMM_NOT_EMPTY` → 유동성이 남은 풀에 Delete 시도
* `terNO_AMM` → 존재하지 않는 풀에 작업 시도
* `tecAMM_BALANCE` → Withdraw 시 잔액 부족
* `tecUNFUNDED_AMM` → AMMCreate 시 자산 잔액 부족
* `.env` 누락 → ADMIN_SEED / USER_SEED 확인 필요

---

## 🔍 추가 참고

* **DefaultRipple은 TrustLine 전에 설정**: 이후에 설정하면 기존 TrustLine에 NoRipple이 남아 AMM 경유 스왑이 실패합니다. 기존 라인은 Issuer가 `TrustSet + tfClearNoRipple`로 수동 해제해야 합니다.
* **AMMCreate Fee = 200,000 drops**: 풀 생성 비용이 일반 TX(12 drops) 대비 매우 높으므로 주의
* **LP Token currency는 풀마다 다름**: getAMMinfo로 조회 후 AMMBid 등에 사용
* **AMMSwap은 Payment TX**: XRPL에 별도 "Swap" 트랜잭션은 없음. `Destination = 자신 + Paths + SendMax` 패턴 사용
* 상세 아키텍처 설명: [`amm_architecture.md`](./amm_architecture.md)
* XRPL 공식 문서: [Automated Market Makers](https://xrpl.org/docs/concepts/tokens/decentralized-exchange/automated-market-makers)
