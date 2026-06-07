# 사주바라

온천처럼 따뜻하지만 결과는 또렷하게 풀어주는 운세 리포트 서비스입니다.

## 핵심 기능

- 사주바라: 생년월일시 기반 사주 리포트
- 오늘의 운세: 대표 사주의 무료 일일 운세와 목적별 유료 택일 운세
- 컬러바라: 음력 생일 기반 컬러수비학 리포트
- 대운 해설: 10년 단위 흐름과 현재 대운 상세
- 연도별 운세: 특정 연도의 월별 흐름과 주제별 운세
- 보관함: 사람별 카드와 구매한 리포트 재진입
- 유자/결제 장부: 실결제 전 권한 정책 설계 포함

## Getting Started

개발 서버 실행:

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

## 환경변수

로컬에서는 `.env.local`을 사용합니다. 커밋 가능한 예시는 `.env.example`을 참고하세요.

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

결제:

- `NEXT_PUBLIC_CHECKOUT_MODE=mock`이면 로컬 테스트 결제
- `NEXT_PUBLIC_CHECKOUT_MODE=portone`이면 PortOne 결제 화면 사용

PortOne 사용 시:

- `NEXT_PUBLIC_PORTONE_STORE_ID`
- `NEXT_PUBLIC_PORTONE_CHANNEL_KEY`
- `NEXT_PUBLIC_PORTONE_PAY_METHOD`
- `PORTONE_API_SECRET`

## 검증

```bash
npm run lint
npm run build
npm run launch:audit
npm run db:verify
```

## 출시

출시 체크리스트는 [docs/launch-checklist.md](docs/launch-checklist.md)를 기준으로 진행합니다.

결제/권한/유자 장부 정책은 [docs/payment-ledger.md](docs/payment-ledger.md)를 기준으로 합니다.

1차 공개는 Vercel 같은 Next.js Node 서버 호스팅을 권장합니다. 정적 호스팅은 API 라우트,
Supabase 세션, OpenAI 생성, 결제 검증을 지원하지 못합니다.

## 콘텐츠 고지

사주, 운세, 컬러수비학 결과는 참고용 콘텐츠이며 전문적인 의학, 법률, 재무, 투자 판단을 대체하지 않습니다.
