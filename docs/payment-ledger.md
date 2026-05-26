# 사주바라 권한/유자 장부 정책

## 원칙

- `paid=1` URL 파라미터는 결제 후 돌아왔다는 표시일 뿐 권한이 아니다.
- 유료 콘텐츠 노출 여부는 항상 `entitlements.scope_key` 기준으로 판단한다.
- 유자는 충전 장부와 사용 장부를 분리한다. 충전 자체는 리포트 권한을 열지 않는다.
- 이미 열린 `scope_key`는 다시 결제시키지 않는다.

## 권한 스코프

```text
saju:{personKey}
daewoon:{personKey}:current
daewoon:{personKey}:{periodIndex}
daewoon:{personKey}:all
yearly:{personKey}:{year}
yearly:{personKey}:all
daily:{personKey}:{YYYY-MM-DD}:{purpose}
yuzu:{count}
```

`yuzu:{count}`는 충전 상품 식별자이며, 유료 리포트 권한 스코프가 아니다.

## 상품별 지급 권한

| 상품 | 가격 | 지급 권한 |
| --- | ---: | --- |
| 이 리포트만 열기 | 990원 | 현재 보고 있는 단일 스코프 1개 |
| 오늘의 바라팩 | 2,900원 | 사주바라 전체 + 현재 대운 + 올해 운세 |
| 내 인생 흐름팩 | 9,900원 | 사주바라 전체 + 전체 대운 + 전체 연도별 운세 |
| 유자 충전 | 990원부터 | 유자 장부 `charge`만 적립 |

## 중복 구매 정책

- 단일 리포트를 이미 보유한 경우: `0원 / 결과 보기`로 처리한다.
- 오늘의 바라팩 구성 중 하나라도 이미 보유한 경우: 바라팩은 숨긴다.
- 부분 보유 할인은 하지 않는다. 2개 보유 후 920원 업그레이드 같은 가격은 만들지 않는다.
- 더 큰 패키지를 사고 싶을 때는 `내 인생 흐름팩`만 별도 선택지로 둔다.
- 이미 구매한 사용자가 같은 주기나 같은 연도를 다시 누르면 결제 화면이 아니라 기존 결과로 이동한다.

## 실결제 처리 순서

1. 결제 시작 시 `payment_orders`에 `pending` 주문을 만든다.
2. PG 승인 완료 후 서버에서 결제 금액과 주문 ID를 검증한다.
3. 검증 성공 시 같은 트랜잭션에서 `payment_orders.status = paid`로 바꾼다.
4. 리포트 상품이면 `entitlements`에 `scope_key`를 `insert ... on conflict do nothing`으로 기록한다.
5. 유자 상품이면 `yuzu_ledger`에 `charge`를 추가하고 `yuzu_wallets` 잔액을 갱신한다.
6. 결과 페이지는 DB 권한 확인 후 유료 본문을 보여준다.

## 개발 모드

현재 로컬 모의 결제는 `sajubara_mock_entitlements` 쿠키에 같은 구조를 축약 저장한다.
실결제 전까지 UI 흐름을 빠르게 검증하기 위한 임시 장부이며, 운영 권한의 최종 소스는 Supabase DB가 된다.
