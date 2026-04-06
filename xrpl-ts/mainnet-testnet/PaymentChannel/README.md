## PaymentChannel

**미리 XRP를 맡겨놓고, 오프체인에서 서명만 주고받다가, 마지막에 한 번만 온체인 정산하는 구조.**

일반 Payment는 매 결제마다 트랜잭션 → 수수료 → 4초 대기가 필요합니다. 스트리밍이나 API 과금처럼 **빈번한 소액 결제**가 필요한 시나리오에서는 비현실적입니다. PaymentChannel은 채널 열 때 1번, 닫을 때 1번 — **중간 결제는 전부 오프체인**으로 처리합니다.

### 동작 방식

1. **Source가 채널을 열고 XRP를 예치** — 이 XRP는 채널에 잠김 (Escrow와 유사)
2. **Source가 오프체인 서명을 발급** — "1 XRP까지 가져가도 됨"이라는 서명을 Destination에게 전달. 트랜잭션이 아니라 **그냥 hex 문자열** (HTTP, QR 등 어떤 방식이든 가능)
3. **금액을 올릴 땐 새 서명 발급** — "2 XRP까지"로 갱신. **누적값**이므로 1+2=3이 아니라 최종 2 XRP
4. **Destination이 최종 정산** — 마지막 서명으로 `PaymentChannelClaim` 한 번 제출하면 온체인 정산 완료

```
[온체인]  Create    — Source가 채널 열고 XRP 예치
[온체인]  Fund      — (선택) 채널에 XRP 추가 예치
[오프체인] Authorize — Source가 서명 생성 → Destination에게 전달
[오프체인] Verify    — Destination이 서명 유효한지 검증
[온체인]  Claim     — Destination이 서명으로 XRP 수령 + 채널 종료
```

### 채널 종료 규칙

- **Destination은 즉시 종료 가능** — `tfClose` 플래그로 Claim하면서 바로 닫음
- **Source는 `SettleDelay`만큼 대기 필요** — Source가 갑자기 닫아버리면 Destination이 미정산 서명을 잃으므로 유예 시간을 줌

### XRPL 결제 수단 비교

| | **Payment** | **PaymentChannel** | **Escrow** | **Check** |
|---|---|---|---|---|
| 한줄 요약 | 즉시 송금 | **오프체인 마이크로페이먼트** | 조건부 예치 | 지연 결제 (수표) |
| 자금 이동 시점 | 즉시 | **Claim 할 때** | Finish 할 때 | Cash 할 때 |
| 자금 잠김? | X (바로 이동) | **O (채널에 예치)** | O (에스크로에 예치) | X (발행자 잔고에 그대로) |
| 취소 가능? | X (이미 전송됨) | **채널 종료로 회수** | 조건부 가능 | O (현금화 전이면 자유롭게) |
| 누가 실행? | 보내는 사람 | **받는 사람 (Claim)** | 누구나 (Finish) | 받는 사람 (Cash) |
| 주 용도 | 일반 송금 | **스트리밍 결제, API 과금** | 조건부 거래, 시간 잠금 | 청구서, 후불 결제 |

### 유스케이스

- **스트리밍 결제**: 영상 1초마다 서명 갱신 → 시청 끝나면 한 번에 Claim
- **API 과금**: 요청 100건마다 서명 갱신 → 월말에 정산
- **IoT 마이크로페이먼트**: 센서 데이터 전송마다 소액씩

---

- **Source (Payer)**: Broker (ADMIN_SEED) — 채널 생성, XRP 예치, 오프체인 서명 발급
- **Destination (Payee)**: User (USER_SEED) — 서명 검증, 온체인 Claim, 채널 종료

---

## 🎯 시나리오 실행 명령어 및 설명

### 1. 채널 생성

```bash
npx ts-node xrpl-ts/mainnet-testnet/PaymentChannel/PaymentChannelCreate.ts
```

* Source가 Destination으로의 Payment Channel을 생성하고 10 XRP를 예치
* `SettleDelay: 86400` (1일) — Source가 채널 종료 요청 시 대기 시간
* `PublicKey`: Source의 공개키 (오프체인 서명 검증용)
* 결과에서 **Channel ID**를 확인하여 나머지 스크립트의 상수에 복사

### 2. 채널 추가 예치

```bash
npx ts-node xrpl-ts/mainnet-testnet/PaymentChannel/PaymentChannelFund.ts
```

* Source가 기존 채널에 5 XRP를 추가 예치 (총 15 XRP)
* `CHANNEL_ID` 상수에 Create 결과의 Channel ID를 먼저 입력

### 3. 오프체인 서명 생성

```bash
npx ts-node xrpl-ts/mainnet-testnet/PaymentChannel/ChannelAuthorize.ts
```

* `channel_authorize` RPC로 오프체인 결제 서명 생성 (트랜잭션 아님)
* Source가 1 XRP 분량의 Claim 권한을 Destination에게 승인
* 결과로 출력되는 **signature**를 ChannelVerify/PaymentChannelClaim 상수에 복사
* `secret` 파라미터로 seed를 서버에 전송하므로 신뢰할 수 있는 서버에서만 사용

### 4. 서명 검증

```bash
npx ts-node xrpl-ts/mainnet-testnet/PaymentChannel/ChannelVerify.ts
```

* `channel_verify` RPC로 서명 유효성 검증 (트랜잭션 아님)
* `SIGNATURE` 상수에 ChannelAuthorize 결과의 서명을 먼저 입력
* 응답: `signature_verified: true` (유효) / `false` (무효)

### 5. 온체인 Claim + 채널 종료

```bash
npx ts-node xrpl-ts/mainnet-testnet/PaymentChannel/PaymentChannelClaim.ts
```

* Destination이 서명을 사용해 1 XRP를 온체인으로 Claim
* `Flags: tfClose (0x00020000)` — Claim과 동시에 채널 종료
* `CHANNEL_ID`, `SIGNATURE` 상수를 먼저 입력

---

## ✅ 예상 결과

성공 시:
* **PaymentChannelCreate** → 채널 생성, `tesSUCCESS`, Channel ID 출력
* **PaymentChannelFund** → 추가 예치, `tesSUCCESS`
* **ChannelAuthorize** → 오프체인 서명(signature) 출력
* **ChannelVerify** → `signature_verified: true`
* **PaymentChannelClaim** → Claim + 채널 종료, `tesSUCCESS`

실패 시:
* `tecNO_ENTRY` → 존재하지 않는 Channel ID 사용
* `tecNO_PERMISSION` → Source가 아닌 계정이 Fund 시도
* `tecUNFUNDED` → 채널 잔액 부족 상태에서 Claim 시도
* `tecNO_TARGET` → Destination 계정이 존재하지 않을 때
* `channelAmtMalformed` / `channelConMalformed` → channel_authorize 파라미터 오류
* `.env` 누락 → ADMIN_SEED / USER_SEED 확인 필요

---

## 🔍 추가 참고

* **Amount/Balance는 누적값**: 1 XRP 서명 후 추가 1.5 XRP 서명을 하면, 총 Claim 가능 금액은 1.5 XRP (2.5가 아님)
* **SettleDelay**: Source가 채널 종료 요청 시 Destination에게 주어지는 Claim 유예 시간. Destination은 즉시 채널 종료(tfClose) 가능
* **CancelAfter/Expiration**: 설정 시 Ripple epoch 사용 (Unix timestamp - 946684800)
* **channel_authorize 보안**: `secret` 파라미터로 seed를 서버에 직접 전송하므로, 프로덕션에서는 로컬 서명(key_type + passphrase)을 권장
* XRPL 공식 문서: [Payment Channels](https://xrpl.org/docs/concepts/payment-types/payment-channels)
