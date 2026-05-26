"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import {
  MOCK_ENTITLEMENT_COOKIE,
  calculateYuzuBalance,
  calculateYuzuPaidTotal,
  emptyMockEntitlements,
  parseMockEntitlements,
  type MockEntitlements,
} from "@/lib/auth/mock-entitlements";
import { formatWon } from "@/lib/payments/checkout-options";
import { reportCheckoutHref } from "@/lib/saju/report-links";

type YuzuPack = {
  count: number;
  amount: number;
  title: string;
  badge?: string;
  description: string;
};

const PACKS: YuzuPack[] = [
  { count: 1, amount: 990, title: "유자 1개", description: "리포트 하나만 가볍게 열기" },
  { count: 3, amount: 2900, title: "유자 3개", badge: "추천", description: "오늘의 바라팩용 기본 충전" },
  { count: 5, amount: 4700, title: "유자 5개", description: "가족·친구 사주까지 볼 때" },
  { count: 10, amount: 8900, title: "유자 10개", description: "대운·연도별까지 넉넉하게" },
];

export default function ChargePage() {
  const [entitlements, setEntitlements] = useState<MockEntitlements>(() =>
    emptyMockEntitlements(),
  );

  useEffect(() => {
    /* eslint-disable react-hooks/set-state-in-effect */
    setEntitlements(parseMockEntitlements(readCookie(MOCK_ENTITLEMENT_COOKIE)));
    /* eslint-enable react-hooks/set-state-in-effect */
  }, []);

  const balance = useMemo(() => calculateYuzuBalance(entitlements), [entitlements]);
  const paidTotal = useMemo(() => calculateYuzuPaidTotal(entitlements), [entitlements]);

  return (
    <>
      <header
        className="shrink-0 px-5 pt-4 pb-3"
        style={{
          background: "rgba(255, 248, 232, 0.9)",
          borderBottom: "1px solid var(--sb-hairline)",
        }}
      >
        <div className="flex items-center justify-between">
          <Link
            href="/"
            className="inline-flex h-9 items-center rounded-full bg-sb-paper px-3 text-[13px] font-bold text-sb-ink-2"
            style={{ boxShadow: "inset 0 0 0 1px var(--sb-hairline)" }}
          >
            홈
          </Link>
          <h1 className="text-[18px] font-extrabold text-sb-olive-dark">충전소</h1>
          <span className="w-[46px]" aria-hidden />
        </div>
      </header>

      <div className="flex-1 overflow-y-auto px-4 pt-4 pb-8">
        <section
          className="rounded-sb-xl px-5 py-5"
          style={{
            background:
              "linear-gradient(145deg, rgba(255,237,172,0.78), rgba(255,253,245,0.92) 56%, rgba(204,225,198,0.62))",
            boxShadow: "var(--shadow-sb-card), inset 0 0 0 1px rgba(91,74,54,0.08)",
          }}
        >
          <p className="text-[11px] font-extrabold uppercase tracking-[0.18em] text-sb-olive">
            Yuzu Wallet
          </p>
          <div className="mt-4 flex items-end justify-between gap-4">
            <div>
              <p className="text-[13px] font-bold text-sb-ink-2">보유 유자</p>
              <div className="mt-1 flex items-center gap-2">
                <YuzuCoin size={34} />
                <strong className="text-[42px] font-extrabold leading-none text-sb-ink">
                  {balance}
                </strong>
                <span className="pb-1 text-[17px] font-extrabold text-sb-ink-2">개</span>
              </div>
            </div>
            <div className="rounded-full bg-sb-paper px-3 py-2 text-right">
              <p className="text-[10px] font-extrabold text-sb-ink-3">테스트 충전액</p>
              <p className="text-[13px] font-extrabold text-sb-olive-dark">
                ₩{formatWon(paidTotal)}
              </p>
            </div>
          </div>
          <p className="mt-4 text-[12px] font-semibold leading-relaxed text-sb-ink-2">
            1 유자는 990원 리포트 1개를 여는 기준 단위예요. 지금은 모의 충전이며,
            실제 결제 전까지 돈은 결제되지 않습니다.
          </p>
        </section>

        <section className="mt-5">
          <div className="mb-3 flex items-end justify-between">
            <div>
              <p className="text-[10.5px] font-extrabold uppercase tracking-[0.18em] text-sb-ink-3">
                Charge Packs
              </p>
              <h2 className="mt-1 text-[20px] font-extrabold text-sb-ink">
                필요한 만큼 충전해두세요
              </h2>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            {PACKS.map((pack) => (
              <Link
                key={pack.count}
                href={reportCheckoutHref({
                  product: `yuzu:${pack.count}`,
                  title: `${pack.title} 충전`,
                  amount: pack.amount,
                  returnTo: "/charge",
                })}
                className="rounded-sb-lg bg-sb-paper px-4 py-4 active:scale-[0.98] transition-transform"
                style={{
                  boxShadow: pack.badge
                    ? "inset 0 0 0 2px var(--sb-olive), var(--shadow-sb-card)"
                    : "var(--shadow-sb-card), inset 0 0 0 1px rgba(91,74,54,0.08)",
                }}
              >
                <div className="flex items-start justify-between">
                  <YuzuStack count={Math.min(pack.count, 5)} />
                  {pack.badge && (
                    <span
                      className="rounded-full px-2 py-[3px] text-[10px] font-extrabold"
                      style={{ background: "var(--sb-yuzu)", color: "var(--sb-olive-dark)" }}
                    >
                      {pack.badge}
                    </span>
                  )}
                </div>
                <h3 className="mt-4 text-[17px] font-extrabold text-sb-ink">{pack.title}</h3>
                <p className="mt-1 min-h-[32px] text-[11.5px] font-semibold leading-snug text-sb-ink-2">
                  {pack.description}
                </p>
                <p className="mt-3 text-[16px] font-extrabold text-sb-olive-dark">
                  ₩{formatWon(pack.amount)}
                </p>
              </Link>
            ))}
          </div>
        </section>

        <section
          className="mt-5 rounded-sb-lg bg-sb-paper px-4 py-4"
          style={{ boxShadow: "inset 0 0 0 1px var(--sb-hairline)" }}
        >
          <h2 className="text-[14px] font-extrabold text-sb-ink">차감 정책 초안</h2>
          <ul className="mt-3 flex flex-col gap-2 text-[12px] font-semibold leading-relaxed text-sb-ink-2">
            <li>· 990원 단품 리포트는 유자 1개로 열 수 있어요.</li>
            <li>· 바라팩은 유자 3개, 인생 흐름팩은 유자 10개 기준으로 맞춥니다.</li>
            <li>· 이미 구매한 리포트는 다시 차감하지 않고 보관함에서 바로 열리게 합니다.</li>
          </ul>
        </section>
      </div>
    </>
  );
}

function readCookie(name: string): string | undefined {
  if (typeof document === "undefined") return undefined;
  const prefix = `${name}=`;
  return document.cookie
    .split(";")
    .map((part) => part.trim())
    .find((part) => part.startsWith(prefix))
    ?.slice(prefix.length);
}

function YuzuStack({ count }: { count: number }) {
  return (
    <div className="flex -space-x-2">
      {Array.from({ length: count }).map((_, index) => (
        <YuzuCoin key={index} size={24} />
      ))}
    </div>
  );
}

function YuzuCoin({ size }: { size: number }) {
  return (
    <span
      className="inline-block rounded-full"
      style={{
        width: size,
        height: size,
        background:
          "radial-gradient(circle at 35% 30%, var(--sb-yuzu-light), var(--sb-yuzu) 62%, var(--sb-yuzu-dark))",
        boxShadow:
          "inset 0 -2px 2px rgba(139,94,60,0.22), 0 2px 6px rgba(216,154,42,0.28)",
      }}
      aria-hidden
    />
  );
}
