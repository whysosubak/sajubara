# 사주바라 출시 체크리스트

## 현재 확인된 상태

- `npm run build` 통과
- `npm run lint` 통과
- `npm run db:verify` 통과
- Supabase `reports` 캐시 테이블 읽기/쓰기 확인
- `.env.local`은 `.gitignore`로 보호됨

## 1차 출시 기준

1. GitHub 원격 저장소 연결
2. Vercel 프로젝트 생성 및 GitHub repo 연결
3. Vercel Production 환경변수 등록
4. Supabase Auth redirect URL에 운영 도메인 추가
5. 결제 모드 결정
   - 내부 테스트: `NEXT_PUBLIC_CHECKOUT_MODE=mock`
   - 실판매: `NEXT_PUBLIC_CHECKOUT_MODE=portone`
6. 법적 문서 노출 확인
   - 이용약관
   - 개인정보 처리방침
   - 환불/청약철회 정책
   - 운세 결과는 참고용 콘텐츠라는 고지
7. 결제/권한 플로우 점검
   - 단일 리포트 990원
   - 오늘의 바라팩 2,900원
   - 내 인생 흐름팩 9,900원
   - 유자 충전 장부
   - 중복 구매 방지

## 운영 환경변수

`.env.example`을 기준으로 Vercel Project Settings > Environment Variables에 등록한다.

필수:

- `OPENAI_API_KEY`
- `OPENAI_MODEL_FULL`
- `OPENAI_MODEL_LITE`
- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- `SUPABASE_SERVICE_ROLE_KEY`
- `NEXT_PUBLIC_CHECKOUT_MODE`

실결제 사용 시 추가:

- `NEXT_PUBLIC_PORTONE_STORE_ID`
- `NEXT_PUBLIC_PORTONE_CHANNEL_KEY`
- `NEXT_PUBLIC_PORTONE_PAY_METHOD`
- `PORTONE_API_SECRET`

## Supabase 설정

운영 도메인이 정해지면 Supabase Dashboard에서 아래 URL을 추가한다.

- Site URL: `https://운영도메인`
- Redirect URLs:
  - `https://운영도메인/auth/callback`
  - `http://localhost:3000/auth/callback`

Google OAuth를 계속 쓴다면 Google Cloud Console의 OAuth Redirect URI에도 아래를 추가한다.

- `https://<supabase-project-ref>.supabase.co/auth/v1/callback`

## 결제 출시 전 필수 점검

실결제 전에는 mock 쿠키가 아니라 서버 장부가 최종 권한 소스가 되어야 한다.

- `payment_orders`: 주문 생성/검증 상태
- `entitlements`: 리포트 권한
- `yuzu_wallets`: 유자 잔액
- `yuzu_ledger`: 충전/사용 내역

정책 원문은 `docs/payment-ledger.md`를 따른다.

## 배포 전 명령

```bash
npm run lint
npm run build
npm run db:verify
```

## 현재 남은 외부 작업

- GitHub CLI 재로그인 또는 원격 저장소 수동 생성
- Vercel 계정 연결
- 운영 도메인 결정
- PortOne/KCP 등 PG 계약 및 실결제 심사
