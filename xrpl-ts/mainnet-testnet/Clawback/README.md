## Clawback

* 발행자가 자신이 발행한 **IOU를 보유자로부터 강제 회수**하는 트랜잭션입니다.
* 규제 준수, 사기 대응, 오발행 정정 등의 상황에서 발행자가 토큰을 직접 회수할 수 있습니다.

---

## 📋 사전 조건

Clawback을 사용하려면 발행자 계정에 `lsfAllowTrustLineClawback` 플래그가 활성화되어 있어야 합니다.

```bash
# AccountSet으로 Clawback 플래그 활성화 (SetFlag: 16)
npx ts-node xrpl-ts/mainnet-testnet/AccountSet/AccountSet.ts
```
* `SetFlag: 16` (`asfAllowTrustLineClawback`)으로 설정

**제약사항:**
* **한번 켜면 끌 수 없음** — 되돌릴 수 없는 영구 설정
* **TrustLine이 없는 상태에서만 설정 가능** — 이미 TrustLine이 존재하면 활성화 실패
* **NoFreeze (`asfNoFreeze`)와 동시 사용 불가** — 둘 중 하나만 선택

---

## 🎯 시나리오 실행 명령어 및 설명

### 1. Clawback 실행
```bash
npx ts-node xrpl-ts/mainnet-testnet/Clawback/Clawback.ts
```
* Admin(발행자)이 User(보유자)로부터 지정한 금액의 IOU를 강제 회수
* `Amount.issuer`에 **보유자(회수 대상)** 주소를 지정 (일반 Payment와 반대)

---

## ✅ 예상 결과

성공 시:
* User의 IOU 잔액에서 지정한 금액이 차감됨
* Explorer에서 TransactionResult: `tesSUCCESS` 확인 가능

실패 시:
* `tecNO_PERMISSION` — 발행자 계정에 lsfAllowTrustLineClawback 미설정
* `tecNO_LINE` — 대상 계정과의 TrustLine이 존재하지 않음
* 회수 금액 > 보유 잔액 → 보유 잔액 전액만 회수됨 (초과분 무시)

---

## 🔍 추가 참고

### Clawback 트랜잭션 필드 구조

| 필드 | 설명 |
|------|------|
| `TransactionType` | `"Clawback"` |
| `Account` | 발행자 (Clawback 실행 주체) |
| `Amount.currency` | 회수할 IOU 통화 코드 |
| `Amount.issuer` | **보유자** (회수 대상 계정) |
| `Amount.value` | 회수할 금액 |

* `Amount.issuer`가 보유자를 가리킨다는 점이 일반 Payment와 다름 (Payment에서는 issuer = 발행자)
* Clawback은 발행자 → 보유자 방향으로만 실행 가능 (보유자가 다른 보유자를 회수할 수 없음)
