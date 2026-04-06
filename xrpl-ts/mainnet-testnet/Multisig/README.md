## Multi-signing (멀티시그)

**여러 명이 서명해야 트랜잭션이 실행되는 다중 서명 구조.**

일반 트랜잭션은 마스터키 1개로 서명하지만, 멀티시그는 계정에 **SignerList**를 등록하여 여러 서명자의 합의가 필요하도록 설정합니다. 각 서명자에게 weight(가중치)를 부여하고, weight 합이 quorum 이상이면 트랜잭션이 실행됩니다.

### 키 관리 방식 비교

| | Master Key | Regular Key | **Multi-signing** |
|---|---|---|---|
| 키 수 | 1개 (변경 불가) | 1개 (교체 가능) | **N개 (유연한 조합)** |
| 서명 주체 | 계정 소유자 | 지정된 대리인 1명 | **여러 명 (quorum 기반)** |
| 용도 | 기본 서명 | 키 로테이션, 위임 | **거버넌스, 보안 강화** |
| 분실 대응 | 계정 영구 잠김 | 마스터키로 교체 | **다른 서명자들이 복구** |

### 이 데모의 구성 (가중 2-of-3)

```
ADMIN 계정 (멀티시그 대상)
  └─ SignerList (Quorum: 3):
       ├── USER    (weight 2) — 핵심 서명자
       ├── Signer2 (weight 1) — 보조 서명자
       └── Signer3 (weight 1) — 보조 서명자

→ USER(2) + Signer2(1) = 3 ≥ Quorum → 실행 가능
→ USER(2) + Signer3(1) = 3 ≥ Quorum → 실행 가능
→ Signer2(1) + Signer3(1) = 2 < Quorum → 실행 불가
```

### 역할

- **ADMIN (ADMIN_SEED)**: 멀티시그 대상 계정 (SignerList 소유)
- **USER (USER_SEED)**: 핵심 서명자 (weight 2)
- **Signer2/3**: 보조 서명자 (SignerListSet에서 자동 생성)

### 라이프사이클

```
SignerListSet (설정) → MultiSignTx (멀티시그 실행) → SignerListDelete (해제)
```

---

## 🎯 시나리오 실행 명령어 및 설명

### 1. SignerList 등록

```bash
npx ts-node xrpl-ts/mainnet-testnet/Multisig/SignerListSet.ts
```

* ADMIN 계정에 2-of-3 멀티시그 설정
* Signer2, Signer3를 자동 생성하고 seed 출력
* 결과에서 **Signer 2 Seed**를 복사하여 MultiSignTx.ts의 `SIGNER2_SEED` 상수에 입력

### 2. 멀티시그 트랜잭션 실행

```bash
npx ts-node xrpl-ts/mainnet-testnet/Multisig/MultiSignTx.ts
```

* ADMIN → USER로 1 XRP 전송 (멀티시그)
* USER(weight 2) + Signer2(weight 1) = quorum 3 충족
* 각 서명자가 독립적으로 서명 → `multisign()`으로 결합 → 제출
* `SIGNER2_SEED` 상수에 SignerListSet 결과의 Signer 2 Seed를 먼저 입력

### 3. SignerList 삭제

```bash
npx ts-node xrpl-ts/mainnet-testnet/Multisig/SignerListDelete.ts
```

* ADMIN 마스터키로 SignerList 삭제 (SignerQuorum: 0)
* OwnerCount -1, reserve 반환

---

## ✅ 예상 결과

성공 시:
* **SignerListSet** → `tesSUCCESS`, SignerList 생성 + 서명자 seed 출력
* **MultiSignTx** → `tesSUCCESS`, Signers 배열에 2명 서명 포함, 1 XRP 전송
* **SignerListDelete** → `tesSUCCESS`, SignerList 삭제

실패 시:
* `tecNO_PERMISSION` → quorum 미달 (서명자 weight 합 부족)
* `tefBAD_QUORUM` → SignerQuorum이 서명자 weight 합보다 큼
* `tefBAD_SIGNATURE` → SignerList에 등록되지 않은 계정이 서명
* `tefNOT_MULTI_SIGNING` → 멀티시그 설정이 안 된 계정에 멀티시그 TX 제출
* `temBAD_SIGNER` → 계정이 자기 자신을 서명자로 등록 시도
* `.env` 누락 → ADMIN_SEED / USER_SEED 확인 필요

---

## 🔍 추가 참고

* **Fee 계산**: `기본 Fee × (1 + 서명자 수)` — 서명자 2명이면 3배, 3명이면 4배
* **비동기 서명**: 서명자들이 동시에 모일 필요 없음 — 각자 서명 후 합치면 됨
* **SignerList 최대**: 서명자 최대 32명 (devnet/mainnet 동일)
* **마스터키 비활성화**: `AccountSet` + `asfDisableMaster`로 마스터키를 끄면 멀티시그로만 트랜잭션 가능 (보안 강화)
* **어떤 TX든 멀티시그 가능**: Payment, TrustSet, OfferCreate 등 모든 트랜잭션 타입에 적용 가능
* XRPL 공식 문서: [Multi-Signing](https://xrpl.org/docs/concepts/accounts/multi-signing)
