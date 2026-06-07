# 바라사주 출시 체크리스트

## 현재 확인된 상태

- `npm run lint` 통과 (이미지/폰트 관련 경고 5개)
- `npm run build` 통과
- `npm run launch:audit` 추가 (현재 Supabase DNS 문제를 에러로 잡음)
- 로컬 확인 서버: `PATH=/opt/homebrew/opt/node@22/bin:$PATH npm run dev -- -H 127.0.0.1`
- 현재 `.env.local`의 Supabase 도메인은 DNS에서 해석되지 않음
- Supabase `reports` 캐시 테이블 읽기/쓰기는 DNS 해결 후 재확인 필요
- `.env.local`은 `.gitignore`로 보호됨

> 이 로컬 환경은 기본 PATH의 Node가 맞지 않으면 native 모듈 서명 문제가 난다. Node 22를 PATH 앞에
> 둔 상태에서 실행한다. Vercel/Linux 환경에서는 새로 `npm ci` 후 빌드 로그에서 `next build` 통과
> 여부를 다시 확인한다.

## 1차 출시 기준

1. GitHub 원격 저장소 연결
2. Vercel 프로젝트 생성 및 GitHub repo 연결
3. Vercel Production 환경변수 등록
4. 운영 도메인 결정 후 `NEXT_PUBLIC_SITE_URL` 등록
5. Supabase Auth redirect URL에 운영 도메인 추가
6. 결제 모드 결정
   - 내부 테스트: `NEXT_PUBLIC_CHECKOUT_MODE=mock`
   - 실판매: `NEXT_PUBLIC_CHECKOUT_MODE=portone`
7. 법적 문서 노출 확인
   - 이용약관
   - 개인정보 처리방침
   - 환불/청약철회 정책
   - 운세 결과는 참고용 콘텐츠라는 고지
8. 결제/권한 플로우 점검
   - 단일 리포트 990원
   - 오늘의 바라팩 2,900원
   - 내 인생 흐름팩 9,900원
   - 유자 충전 장부
   - 중복 구매 방지
9. `/api/health`, `/robots.txt`, `/sitemap.xml` 확인

## 운영 환경변수

`.env.example`을 기준으로 Vercel Project Settings > Environment Variables에 등록한다.

필수:

- `OPENAI_API_KEY`
- `OPENAI_MODEL` (기존 호환용, 선택)
- `OPENAI_MODEL_FULL`
- `OPENAI_MODEL_LITE`
- `NEXT_PUBLIC_SITE_URL`
- `NEXT_PUBLIC_INDEX_SITE`
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

현재 로컬의 `NEXT_PUBLIC_SUPABASE_URL`은 DNS 조회가 실패한다. 실제 Supabase 프로젝트의 API URL을
다시 복사해 `.env.local`과 Vercel 환경변수에 넣은 뒤 `npm run launch:audit`와
`npm run db:verify`를 다시 실행한다.

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
npm run launch:audit
npm run db:verify
```

Vercel에서 배포한 뒤:

```bash
curl -I https://운영도메인
curl https://운영도메인/api/health
curl https://운영도메인/robots.txt
curl https://운영도메인/sitemap.xml
```

## 현재 남은 외부 작업

- GitHub CLI 재로그인 또는 원격 저장소 수동 생성
- Vercel 계정 연결
- 운영 도메인 결정
- 실제 Supabase 프로젝트 URL 재확인
- PortOne/KCP 등 PG 계약 및 실결제 심사
