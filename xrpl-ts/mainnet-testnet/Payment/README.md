## Payment
* XRPL에서 **계정 간 자산 전송**을 수행하는 스크립트 모음입니다.  
* 송금 자산은 **XRP**(drops 단위 문자열) 또는 **IOU**(CurrencyAmount 객체)로 지정할 수 있습니다.  

- **XRP 전송**: `Amount: "1000"` (drops)  
- **IOU 전송**: `Amount: { currency, issuer, value }`  
- **사전 조건(IOU)**: 수신자가 해당 IOU의 **TrustLine**을 보유해야 수취 가능  
- **RequireAuth 활성화** 시: 수신자는 반드시 **승인(allow trust)** 상태여야 수취 가능

### XRPL 결제 수단 비교

| | **Payment** | **PaymentChannel** | **Escrow** | **Check** |
|---|---|---|---|---|
| 한줄 요약 | **즉시 송금** | 오프체인 마이크로페이먼트 | 조건부 예치 | 지연 결제 (수표) |
| 자금 이동 시점 | **즉시** | Claim 할 때 | Finish 할 때 | Cash 할 때 |
| 자금 잠김? | **X (바로 이동)** | O (채널에 예치) | O (에스크로에 예치) | X (발행자 잔고에 그대로) |
| 취소 가능? | **X (이미 전송됨)** | 채널 종료로 회수 | 조건부 가능 | O (현금화 전이면 자유롭게) |
| 누가 실행? | **보내는 사람** | 받는 사람 (Claim) | 누구나 (Finish) | 받는 사람 (Cash) |
| 주 용도 | **일반 송금** | 스트리밍 결제, API 과금 | 조건부 거래, 시간 잠금 | 청구서, 후불 결제 |

---

## 🎯 시나리오 실행 명령어 및 설명  

### 1. XRP 전송
```bash
npx ts-node xrpl-ts/mainnet-testnet/Payment/sendXRP.ts
``` 
* Admin 계정이 User 계정으로 XRP를 송금 (`Amount`는 drops 단위 문자열, 예: `"1000"` = 0.001 XRP)

---

### 2. IOU 전송
```bash
npx ts-node xrpl-ts/mainnet-testnet/Payment/sendIOU.ts
```
* Admin(발행자) 계정이 User 계정으로 IOU를 송금  
* `Amount`는 `{ currency, issuer, value }` 형식이며, User는 해당 IOU의 TrustLine을 반드시 보유해야 함  

---

## ✅ 예상 결과
성공 시:
* send-xrp.ts 실행 → User 지갑에 지정한 수량의 XRP가 도착  
* send-iou.ts 실행 → User 지갑에 지정한 IOU가 도착, Explorer에서 `tesSUCCESS` 확인 가능  

실패 시:
* User가 IOU 신뢰선을 보유하지 않은 경우 → `tecNO_LINE` / `tecNO_AUTH` 오류  
* 발행자 계정이 RequireAuth 설정 시 승인되지 않은 계정 → 수취 실패  
* .env 누락 또는 노드 연결 실패 → 실행 불가  

---

## 🔍 추가 참고

