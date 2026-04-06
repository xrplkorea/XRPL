## AccountSet
* XRPL 계정의 **플래그/설정값**을 변경하는 트랜잭션입니다.  
* RequireAuth, DefaultRipple, DisallowXRP, TickSize, Domain, TransferRate 등 계정 정책/운영 관련 옵션을 제어할 수 있습니다.  

---

## 🎯 시나리오 실행 명령어 및 설명  

### 1. RequireAuth 활성화
```bash
npx ts-node xrpl-ts/mainnet-testnet/AccountSet/AccountSet.ts
```
* Admin 계정이 AccountSet 트랜잭션을 전송하여 RequireAuth 플래그를 활성화 (`SetFlag: asfRequireAuth`)  
---
### 2. (옵션) RequireAuth 환경에서 TrustSet 승인
```bash
npx ts-node xrpl-ts/TrustSet/authorizeTrustLine.ts
```
* RequireAuth 설정된 Admin이 User의 IOU 신뢰선을 승인 → User가 해당 IOU를 정상 수취 가능  

---

## ✅ 예상 결과
성공 시:
* Admin 계정에 RequireAuth 플래그가 반영됨  
* User가 TrustSet을 보낸 경우, Admin 승인 후 IOU 수취 가능  
* Explorer에서 TransactionResult: `tesSUCCESS` 확인 가능  

실패 시:
* 플래그 값 오류/중복 → `temMALFORMED`  
* .env 누락 → Admin/User 시드 확인 필요  
* 노드 연결 실패 → Devnet WS URL 확인  

---

## 🔍 추가 참고

### RequireAuth란?

* **SetFlag: 2 (`asfRequireAuth`)** — 발행자가 IOU를 수신할 수 있는 계정을 사전 승인하도록 강제하는 플래그입니다.
* 규제/컴플라이언스 환경에서 KYC를 통과한 계정에만 IOU를 허용할 때 사용합니다.

**RequireAuth가 켜진 경우 IOU 발행 흐름:**

1. **Admin(발행자)**: `AccountSet`으로 `asfRequireAuth` 활성화
2. **User(수신자)**: `TrustSet`으로 신뢰선 생성 요청 (이 시점에서는 아직 IOU 수신 불가)
3. **Admin(발행자)**: `TrustSet + tfSetAuth (0x00010000)`로 해당 User의 신뢰선을 승인
4. 승인 완료 후 User가 IOU를 정상 수신 가능

**주의사항:**
* **한번 켜면 끌 수 없음** — `ClearFlag: 2`로 해제 시도 시 `tecOWNERS` 또는 무시됨
* **기존 TrustLine에는 소급 적용되지 않음** — RequireAuth 활성화 전에 이미 생성된 TrustLine은 승인 없이도 유효
* NoFreeze(`asfNoFreeze`)와 함께 사용 가능하지만, AllowTrustLineClawback과는 상호 보완적 관계

