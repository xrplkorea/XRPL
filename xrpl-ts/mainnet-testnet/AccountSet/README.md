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

