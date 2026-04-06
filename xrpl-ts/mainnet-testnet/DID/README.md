## DID (Decentralized Identifier)

**XRPL 계정에 탈중앙 신원 정보를 온체인으로 연결하는 기능.**

W3C DID 표준을 기반으로, XRPL 계정에 DID Document URI, 공개 증명 데이터(Data), DID 문서(DIDDocument)를 직접 저장할 수 있습니다. 계정당 1개의 DID만 존재하며, 외부 저장소(IPFS 등)의 DID Document를 URI로 참조하는 구조가 일반적입니다.

### DID 식별자 형식

```
did:xrpl:<network-id>:<account-address>
예: did:xrpl:1:rPd2YHd9VRiMDv9Qdxkpp4ACjVN4X99FrB
```

- **ADMIN (ADMIN_SEED)**: DID 소유자 — 생성·업데이트·삭제
- **라이프사이클**: DIDSet (생성) → DIDGet (조회) → DIDSet (업데이트) → DIDDelete (삭제)

---

## 🎯 시나리오 실행 명령어 및 설명

### 1. DID 생성

```bash
npx ts-node xrpl-ts/mainnet-testnet/DID/DIDSet.ts
```

* ADMIN 계정에 DID 생성
* `URI`: 외부 DID Document 위치 (hex 인코딩)
* `Data`: 공개 증명 데이터 (hex 인코딩)
* `DIDDocument`: W3C DID 문서 (hex 인코딩, 선택)
* Data/DIDDocument/URI 중 **최소 1개 필수** (모두 비면 `tecEMPTY_DID`)
* 동일 계정으로 재실행하면 **업데이트** (필드 삭제: `""` 설정)

### 2. DID 조회

```bash
npx ts-node xrpl-ts/mainnet-testnet/DID/DIDGet.ts
```

* `ledger_entry` RPC로 ADMIN 계정의 DID 객체 조회
* 저장된 hex 값을 디코딩하여 원문 출력

### 3. DID 삭제

```bash
npx ts-node xrpl-ts/mainnet-testnet/DID/DIDDelete.ts
```

* ADMIN 계정의 DID 객체 삭제
* OwnerCount -1, reserve 0.2 XRP 반환

---

## ✅ 예상 결과

성공 시:
* **DIDSet** → DID 생성, `tesSUCCESS`
* **DIDGet** → URI, Data 디코딩 출력
* **DIDDelete** → DID 삭제, `tesSUCCESS`

실패 시:
* `tecEMPTY_DID` → Data/DIDDocument/URI 모두 비어있을 때
* `tecNO_ENTRY` → 존재하지 않는 DID 삭제 시도
* `temDISABLED` → DID amendment가 네트워크에 비활성화
* `.env` 누락 → ADMIN_SEED 확인 필요

---

## 🔍 추가 참고

* **모든 값은 hex 인코딩**: `Buffer.from(str, "utf8").toString("hex")` 사용, 각 필드 최대 256바이트
* **계정당 DID 1개**: 재실행 시 기존 DID를 업데이트 (새로 만들지 않음)
* **필드 삭제**: `DIDSet`에서 특정 필드를 빈 문자열(`""`)로 설정하면 해당 필드만 삭제
* **Owner reserve**: DID 생성 시 0.2 XRP 잠김, 삭제 시 반환
* XRPL 공식 문서: [Decentralized Identifiers](https://xrpl.org/docs/concepts/decentralized-storage/decentralized-identifiers)
