## TokenEscrow

* XRPL의 **기존 XRP 전용 Escrow 기능을 확장**하여, IOU 토큰과 MPT(Multi-Purpose Token)도 에스크로에 걸 수 있게 하는 기능입니다.  
* IOU는 TrustLine과 발행자 정책(RequireAuth, Freeze 등)이 필요하며, MPT는 별도의 플래그(tfMPTCanEscrow, tfMPTCanTransfer)로 제어됩니다.

### XRPL 결제 수단 비교

| | **Payment** | **PaymentChannel** | **Escrow** | **Check** |
|---|---|---|---|---|
| 한줄 요약 | 즉시 송금 | 오프체인 마이크로페이먼트 | **조건부 예치** | 지연 결제 (수표) |
| 자금 이동 시점 | 즉시 | Claim 할 때 | **Finish 할 때** | Cash 할 때 |
| 자금 잠김? | X (바로 이동) | O (채널에 예치) | **O (에스크로에 예치)** | X (발행자 잔고에 그대로) |
| 취소 가능? | X (이미 전송됨) | 채널 종료로 회수 | **조건부 가능** | O (현금화 전이면 자유롭게) |
| 누가 실행? | 보내는 사람 | 받는 사람 (Claim) | **누구나 (Finish)** | 받는 사람 (Cash) |
| 주 용도 | 일반 송금 | 스트리밍 결제, API 과금 | **조건부 거래, 시간 잠금** | 청구서, 후불 결제 |

---

## 🎯 시나리오 실행 명령어 및 설명  

### 1. 에스크로 생성
```bash
    npx ts-node xrpl-ts/mainnet-testnet/TokenEscrow/escrowCreateMPT.ts
    npx ts-node xrpl-ts/mainnet-testnet/TokenEscrow/escrowCreateIOU.ts
```
* User가 특정 IOU/MPT를 Escrow에 잠그는 트랜잭션 실행 (FinishAfter / CancelAfter 조건 포함)  

### 2. 에스크로 해제
```bash
    npx ts-node xrpl-ts/mainnet-testnet/TokenEscrow/escrowFinish.ts
```
* FinishAfter가 경과하면, 누구나 Escrow 객체를 해제하고 잔액을 목적지로 이동  

### 3. 에스크로 취소
```bash
    npx ts-node xrpl-ts/mainnet-testnet/TokenEscrow/escrowCancel.ts
```
* CancelAfter가 경과하면, 누구나 Escrow 객체를 취소하고 원래 소스로 자산 반환  

---

## ✅ 예상 결과
성공 시:

* EscrowCreate 실행 → Explorer에서 `tesSUCCESS` 및 Escrow 객체 생성 확인  
* EscrowFinish 실행 → Escrow 객체 삭제 및 잔액 이동  
* EscrowCancel 실행 → Escrow 객체 삭제 및 원래 소스로 잔액 반환  

실패 시:

* IOU/MPT 조건 위반 (CancelAfter 누락, 발행자 플래그 미설정 등) → Invalid Transaction  
* RequireAuth / Freeze / Lock 정책 위반 시 거부  
* xrpl.js 기본 서명 사용 시 IOU/MPT Escrow는 Invalid signature → 반드시 raw signing 방식 필요(노션 참고)  

---

## 🔍 추가 참고


