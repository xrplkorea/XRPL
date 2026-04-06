## DEX (Decentralized Exchange — Orderbook)

**XRPL 네이티브 오더북 DEX — 별도 컨트랙트 없이 프로토콜 레벨에서 지정가 주문이 가능합니다.**

XRPL의 DEX는 ledger에 내장된 오더북으로, `OfferCreate` 트랜잭션으로 매수/매도 주문을 제출합니다. 체결 가능한 상대 오퍼가 있으면 즉시 매칭되고, 없으면 오더북에 남아 대기합니다.

### AMM과 비교

| | DEX Orderbook | AMM |
|---|---------|--------|
| 가격 결정 | 주문자가 지정 (지정가) | 수학 공식 (x×y=k) |
| 유동성 | 개별 주문으로 구성 | 풀에 예치된 자산 |
| 슬리피지 | 없음 (지정가 체결) | 거래량에 비례 |
| 적합한 시장 | 유동성 높은 주요 페어 | 롱테일/틈새 페어 |
| 수수료 | 없음 (네트워크 Fee만) | TradingFee (LP에게 분배) |

> **참고**: XRPL에서는 DEX Orderbook과 AMM이 공존하며, Payment 경로 탐색 시 양쪽 모두 활용됩니다.

### Permissioned DEX와 차이

| | DEX (이 폴더) | Permissioned DEX |
|---|---------|--------|
| 참여 조건 | 누구나 | 특정 Domain 소속 + Credential 보유 |
| DomainID | 없음 | 필수 (오퍼에 DomainID 지정) |
| 오더북 | 오픈 오더북 | 도메인별 분리된 오더북 |
| 용도 | 일반 거래 | 규제 준수 (KYC/AML) 환경 |

### 역할

- **ADMIN (ADMIN_SEED)**: IOU 발행자 (ABC 토큰)
- **USER (USER_SEED)**: 트레이더 (오퍼 생성/취소)

### 라이프사이클

```
_setup (IOU 준비) → OfferCreate → getOrderbook (확인) → OfferCancel
```

---

## 🎯 시나리오 실행 명령어 및 설명

### 0. 사전 설정 (IOU 준비)

```bash
npx ts-node xrpl-ts/mainnet-testnet/DEX/_setup.ts
```

* ADMIN: DefaultRipple 활성화
* USER → ADMIN IOU TrustLine 설정
* ADMIN → USER: 100 ABC 발행
* AMM `_setup`을 이미 실행했다면 생략 가능

### 1. 오퍼 생성

```bash
npx ts-node xrpl-ts/mainnet-testnet/DEX/OfferCreate.ts
```

* USER가 10 ABC를 팔고 10 XRP를 받는 오퍼 생성
* `TakerGets` = 시장이 가져가는 것 (= 내가 파는 것)
* `TakerPays` = 시장이 지불하는 것 (= 내가 받는 것)
* 결과에서 **Offer Sequence**를 확인하여 OfferCancel 상수에 복사

### 2. 오더북 조회

```bash
npx ts-node xrpl-ts/mainnet-testnet/DEX/getOrderbook.ts
```

* `book_offers` RPC로 XRP ↔ ABC 오더북 양방향 조회
* OfferCreate로 생성한 오퍼가 표시되는지 확인

### 3. 오퍼 취소

```bash
npx ts-node xrpl-ts/mainnet-testnet/DEX/OfferCancel.ts
```

* USER가 기존 오퍼를 취소
* `OFFER_SEQUENCE` 상수에 OfferCreate 결과의 Sequence를 먼저 입력

---

## ✅ 예상 결과

성공 시:
* **_setup** → DefaultRipple + TrustLine + Payment 모두 `tesSUCCESS`
* **OfferCreate** → `tesSUCCESS`, Offer Sequence 출력
* **getOrderbook** → 생성한 오퍼가 오더북에 표시
* **OfferCancel** → `tesSUCCESS`, 오더북에서 오퍼 삭제

실패 시:
* `tecUNFUNDED_OFFER` → 판매할 자산 잔액 부족 (_setup 먼저 실행)
* `tecINSUF_RESERVE_OFFER` → reserve 부족 (오퍼도 owner reserve 0.2 XRP 차지)
* `tecKILLED` → `tfFillOrKill` 오퍼가 전량 체결되지 못한 경우
* `.env` 누락 → ADMIN_SEED / USER_SEED 확인 필요

---

## 🔍 추가 참고

* **TakerGets/TakerPays 헷갈림 주의**: "Taker"는 상대방(시장) 관점. 내가 파는 것 = TakerGets, 내가 받는 것 = TakerPays
* **즉시 체결**: 오더북에 매칭 가능한 오퍼가 있으면 OfferCreate 시점에 자동 체결 (별도 매칭 불필요)
* **Flags 옵션**: `tfPassive`(0x00010000) = 기존 오퍼와 매칭하지 않음, `tfImmediateOrCancel`(0x00020000) = 즉시 체결 안 되면 취소, `tfFillOrKill`(0x00040000) = 전량 체결 아니면 취소, `tfSell`(0x00080000) = TakerGets 기준 판매
* **Offer reserve**: 각 오퍼는 owner reserve 0.2 XRP 차지 (취소/체결 시 해제)
* **Expiration**: Ripple epoch 기준 만료 시간 설정 가능
* XRPL 공식 문서: [Decentralized Exchange](https://xrpl.org/docs/concepts/tokens/decentralized-exchange)
