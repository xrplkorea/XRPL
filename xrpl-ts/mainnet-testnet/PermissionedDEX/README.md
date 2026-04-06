## Permissioned DEX

**도메인 규칙이 적용된 DEX — 특정 Domain 소속 + Credential 보유 계정만 거래에 참여할 수 있습니다.**

> **일반 DEX(Orderbook)와 차이점**: 일반 DEX(`xrpl-ts/DEX/`)는 누구나 참여할 수 있는 오픈 오더북입니다. Permissioned DEX는 여기에 **DomainID**와 **AcceptedCredentials** 조건을 추가하여, 규제 준수(KYC/AML) 환경에서 허가된 참가자만 거래하도록 제한합니다. 트랜잭션 자체는 동일한 `OfferCreate`/`OfferCancel`이며, DomainID 유무가 핵심 차이입니다.

* Permissioned Offer = DomainID가 붙은 오퍼 / Open Offer = DomainID 없는 오퍼

---

## 🎯 시나리오 실행 명령어 및 설명

### 1. Permissioned Offer 생성
```bash
npx ts-node xrpl-ts/mainnet-testnet/PermissionedDEX/createPermissionedOffer.ts
```
* 트레이더 계정이 도메인에 소속되어 있어야 하며, DomainID를 지정해 Offer 생성  
* `TakerGets` / `TakerPays` 자산 지정, AcceptedCredentials 조건 만족 필요  

---

### 2. 오더북 조회
```bash
npx ts-node xrpl-ts/mainnet-testnet/PermissionedDEX/bookOffers.ts
```
* `book_offers` RPC 호출  
* `domain` 파라미터 포함 시 해당 도메인의 오더북만 표시, 생략 시 오픈 오더북 조회  

---

### 3. Permissioned Offer 취소
```bash
npx ts-node xrpl-ts/mainnet-testnet/PermissionedDEX/cancelOffer.ts
```
* 오퍼 생성자가 `OfferCancel` 트랜잭션으로 지정한 `OfferSequence`를 취소  

---

## ✅ 예상 결과
성공 시:
* Permissioned Offer가 도메인 규칙에 따라 생성  
* book_offers 결과에 해당 DomainID의 오더북이 표시  
* OfferCancel 실행 시 지정한 오퍼가 정상 취소됨  
* Explorer에서 `TransactionResult: tesSUCCESS` 확인 가능  

실패 시:
* 트레이더가 AcceptedCredentials를 보유하지 않으면 Offer 생성 불가  
* DomainID를 잘못 지정하면 Permissioned 오더북 조회 불가  
* .env 누락 또는 노드 연결 실패 시 실행 불가  

---

## 🔍 추가 참고

