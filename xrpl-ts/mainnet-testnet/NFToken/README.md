## NFToken

**XRPL 네이티브 NFT — 별도 스마트 컨트랙트 없이 프로토콜 레벨에서 NFT 발행·거래·소각이 가능합니다.**

Ethereum의 ERC-721과 달리, XRPL의 NFToken은 ledger에 직접 저장되며 오더북 기반 거래를 지원합니다. 발행자는 로열티(TransferFee)를 설정할 수 있고, 2차 거래 시 자동으로 수수료가 적용됩니다.

### ERC-721과 비교

| | ERC-721 (Ethereum) | NFToken (XRPL) |
|---|---------|--------|
| 발행 방식 | 스마트 컨트랙트 배포 | 트랜잭션 1건 (NFTokenMint) |
| 거래 | 마켓플레이스 컨트랙트 필요 | 프로토콜 내장 오퍼 시스템 |
| 로열티 | 표준 없음 (EIP-2981 선택적) | TransferFee로 강제 적용 |
| 저장 | 컨트랙트 state | ledger 오브젝트 (NFTokenPage) |
| 비용 | 가스비 (수만~수십만 원) | ~0.000001 XRP |

### 역할

- **ADMIN (ADMIN_SEED)**: NFT 발행자 (Issuer), 판매자
- **USER (USER_SEED)**: NFT 구매자, 소유자

### 라이프사이클

```
Mint → CreateSellOffer → AcceptOffer → Burn
```

---

## 🎯 시나리오 실행 명령어 및 설명

### 1. NFT 발행

```bash
npx ts-node xrpl-ts/mainnet-testnet/NFToken/NFTokenMint.ts
```

* ADMIN이 NFT를 발행
* `Flags: 9` = `tfBurnable(1)` + `tfTransferable(8)` — 소각 가능 + 양도 가능
* `TransferFee: 5000` = 5% 로열티 (2차 판매 시 Issuer에게 자동 지급)
* `URI`: 메타데이터 URL (hex 인코딩, `convertStringToHex` 사용)
* 결과에서 **NFToken ID**를 확인하여 나머지 스크립트 상수에 복사

### 2. 판매 오퍼 생성

```bash
npx ts-node xrpl-ts/mainnet-testnet/NFToken/NFTokenCreateSellOffer.ts
```

* ADMIN(소유자)이 5 XRP에 판매 오퍼 생성
* `Flags: 1` = `tfSellNFToken` (판매 오퍼)
* `NFTOKEN_ID` 상수에 Mint 결과의 NFToken ID를 먼저 입력
* 결과에서 **Offer ID**를 확인하여 AcceptOffer 상수에 복사

### 3. 오퍼 수락 (구매)

```bash
npx ts-node xrpl-ts/mainnet-testnet/NFToken/NFTokenAcceptOffer.ts
```

* USER가 판매 오퍼를 수락 → 5 XRP 지불 + NFT 소유권 이전
* `SELL_OFFER_ID` 상수에 CreateSellOffer 결과의 Offer ID를 먼저 입력

### 4. NFT 소각

```bash
npx ts-node xrpl-ts/mainnet-testnet/NFToken/NFTokenBurn.ts
```

* USER(현재 소유자)가 NFT를 소각
* `tfBurnable`로 발행된 경우, Issuer(ADMIN)도 `Owner` 필드로 타인의 NFT 소각 가능
* `NFTOKEN_ID` 상수에 소각할 NFToken ID를 먼저 입력

---

## ✅ 예상 결과

성공 시:
* **NFTokenMint** → `tesSUCCESS`, NFToken ID 출력
* **NFTokenCreateSellOffer** → `tesSUCCESS`, Offer ID 출력
* **NFTokenAcceptOffer** → `tesSUCCESS`, 소유권 이전 (5 XRP 지불)
* **NFTokenBurn** → `tesSUCCESS`, NFTokenPage에서 삭제

실패 시:
* `tecNO_PERMISSION` → 소유자가 아닌 계정이 Offer/Burn 시도
* `tecNO_ENTRY` → 존재하지 않는 NFToken/Offer ID
* `tecCANT_ACCEPT_OWN_NFTOKEN_OFFER` → 자신의 오퍼를 자신이 수락
* `tecINSUFFICIENT_FUNDS` → 구매 대금 부족
* `tecNFTOKEN_BUY_SELL_MISMATCH` → 브로커 모드에서 매수/매도 NFT ID 불일치
* `.env` 누락 → ADMIN_SEED / USER_SEED 확인 필요

---

## 🔍 추가 참고

* **URI는 hex 인코딩 필수**: `convertStringToHex("https://...")` 사용, 최대 256바이트
* **Flags는 발행 시 고정 (immutable)**: `tfBurnable`, `tfTransferable` 등은 Mint 후 변경 불가
* **TransferFee**: 0~50000 (0.000%~50.000%), `tfTransferable` 플래그와 함께 사용해야 유효
* **NFTokenPage**: NFT는 계정별 page에 최대 32개씩 저장. page당 owner reserve 0.2 XRP (~1/12 XRP per NFT)
* **Offer reserve**: 각 NFTokenOffer도 owner reserve 0.2 XRP 차지 (수락/취소 시 해제)
* **Buy Offer 패턴**: 구매자가 `NFTokenCreateOffer`(Flags 없음) + `Owner` 지정 → 판매자가 `NFTokenAcceptOffer`의 `NFTokenBuyOffer`로 수락
* XRPL 공식 문서: [NFTokens](https://xrpl.org/docs/concepts/tokens/nfts)
