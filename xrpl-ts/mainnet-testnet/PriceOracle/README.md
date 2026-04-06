## PriceOracle

* XRPL의 **Price Oracle** 기능으로, 온체인에 외부 자산 가격 데이터를 게시하고 집계된 가격을 조회할 수 있습니다.
* Oracle Provider가 가격 데이터를 주기적으로 업데이트하면, 다른 프로토콜(Lending, DEX 등)이 집계된 가격을 참조할 수 있습니다.

- **Provider (Oracle 운영자)**: Broker (ADMIN_SEED) — Oracle 생성·업데이트·삭제 권한
- **OracleDocumentID**: `1` (계정당 고유 식별자, 0~4294967295)
- **PriceDataSeries**: 최대 10개 가격 쌍 (BaseAsset/QuoteAsset)
- **AssetPrice**: 16진수 정수, `Scale`과 함께 실제 가격 산출 (`AssetPrice × 10^(-Scale)`)

---

## 🎯 시나리오 실행 명령어 및 설명

### 1. Oracle 생성 / 업데이트

```bash
npx ts-node xrpl-ts/mainnet-testnet/PriceOracle/OracleSet.ts
```

* Provider가 Oracle을 생성하고 가격 데이터를 게시
* **PriceDataSeries**: XRP/USD ($0.42), BTC/USD ($10,000) 2개 쌍
* `Provider`: "catalyze", `AssetClass`: "currency" (hex: `63757272656E6379`)
* `LastUpdateTime`: 실행 시점의 Unix 타임스탬프 자동 계산 (Ripple epoch가 아닌 Unix epoch)
* 동일 `OracleDocumentID`로 재실행하면 가격 데이터 **업데이트** (덮어쓰기)

### 2. 집계 가격 조회

```bash
npx ts-node xrpl-ts/mainnet-testnet/PriceOracle/GetAggregatePrice.ts
```

* `get_aggregate_price` RPC로 XRP/USD 집계 가격 조회
* `oracles` 배열에 여러 Provider를 추가하면 다중 소스 집계 가능
* `trim: 20` — 상하위 20%를 제외한 trimmed mean 계산
* 응답: `entire_set` (mean, size, sd), `trimmed_set` (mean, size, sd), `median`, `time`

### 3. Oracle 삭제

```bash
npx ts-node xrpl-ts/mainnet-testnet/PriceOracle/OracleDelete.ts
```

* Provider가 Oracle 객체를 삭제
* 삭제 후 동일 `OracleDocumentID`로 재생성 가능

---

## ✅ 예상 결과

성공 시:
* **OracleSet** → Oracle 객체 생성, `tesSUCCESS`
* **GetAggregatePrice** → `entire_set.mean`, `median` 등 집계 가격 출력
* **OracleDelete** → Oracle 객체 삭제, `tesSUCCESS`

실패 시:
* `tecINVALID_UPDATE_TIME` → LastUpdateTime이 ledger close time ± 300초 범위 밖이거나, 이전 값보다 작을 때
* `tecNO_ENTRY` → 존재하지 않는 Oracle 삭제/조회 시도
* `tecARRAY_TOO_LARGE` → PriceDataSeries가 10개 초과
* `oracleNotFound` → get_aggregate_price에서 해당 Oracle이 없을 때
* `.env` 누락 → ADMIN_SEED 확인 필요

---

## 🔍 추가 참고

* **AssetPrice 계산**: `AssetPrice`(hex) × 10^(-`Scale`) = 실제 가격
  * 예: `AssetPrice: "2a"` (=42), `Scale: 2` → 42 × 10^(-2) = **$0.42**
  * 예: `AssetPrice: "F4240"` (=1000000), `Scale: 2` → 1000000 × 10^(-2) = **$10,000**
* **LastUpdateTime**: Unix timestamp (Ripple epoch가 아님! ledger close time ± 300초 이내여야 함)
* **다중 Oracle 집계**: `get_aggregate_price`의 `oracles` 배열에 여러 Provider를 추가하면 중앙값/평균 등 집계 가능
* XRPL 공식 문서: [Price Oracles](https://xrpl.org/docs/concepts/payment-types/price-oracles)
