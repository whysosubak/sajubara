"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { useI18n } from "@/app/components/LanguageProvider";
import LanguageSwitcher from "@/app/components/LanguageSwitcher";
import type { TranslationKey } from "@/app/i18n";
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
  titleKey: TranslationKey;
  badgeKey?: TranslationKey;
  descriptionKey: TranslationKey;
};

const PACKS: YuzuPack[] = [
  {
    count: 1,
    amount: 990,
    titleKey: "charge.pack.one.title",
    descriptionKey: "charge.pack.one.description",
  },
  {
    count: 3,
    amount: 2900,
    titleKey: "charge.pack.three.title",
    badgeKey: "charge.pack.three.badge",
    descriptionKey: "charge.pack.three.description",
  },
  {
    count: 5,
    amount: 4700,
    titleKey: "charge.pack.five.title",
    descriptionKey: "charge.pack.five.description",
  },
  {
    count: 10,
    amount: 8900,
    titleKey: "charge.pack.ten.title",
    descriptionKey: "charge.pack.ten.description",
  },
];

export default function ChargePage() {
  const { t } = useI18n();
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
            {t("common.home")}
          </Link>
          <h1 className="text-[18px] font-extrabold text-sb-olive-dark">
            {t("charge.title")}
          </h1>
          <LanguageSwitcher compact />
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
            {t("charge.wallet")}
          </p>
          <div className="mt-4 flex items-end justify-between gap-4">
            <div>
              <p className="text-[13px] font-bold text-sb-ink-2">{t("charge.balance")}</p>
              <div className="mt-1 flex items-center gap-2">
                <YuzuCoin size={34} />
                <strong className="text-[42px] font-extrabold leading-none text-sb-ink">
                  {balance}
                </strong>
                <span className="pb-1 text-[17px] font-extrabold text-sb-ink-2">
                  {t("charge.countUnit")}
                </span>
              </div>
            </div>
            <div className="rounded-full bg-sb-paper px-3 py-2 text-right">
              <p className="text-[10px] font-extrabold text-sb-ink-3">
                {t("charge.testAmount")}
              </p>
              <p className="text-[13px] font-extrabold text-sb-olive-dark">
                ₩{formatWon(paidTotal)}
              </p>
            </div>
          </div>
          <p className="mt-4 text-[12px] font-semibold leading-relaxed text-sb-ink-2">
            {t("charge.description")}
          </p>
        </section>

        <section className="mt-5">
          <div className="mb-3 flex items-end justify-between">
            <div>
              <p className="text-[10.5px] font-extrabold uppercase tracking-[0.18em] text-sb-ink-3">
                {t("charge.packs")}
              </p>
              <h2 className="mt-1 text-[20px] font-extrabold text-sb-ink">
                {t("charge.heading")}
              </h2>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            {PACKS.map((pack) => (
              <Link
                key={pack.count}
                href={reportCheckoutHref({
                  product: `yuzu:${pack.count}`,
                  title: t("charge.checkoutTitle", { title: t(pack.titleKey) }),
                  amount: pack.amount,
                  returnTo: "/charge",
                })}
                className="rounded-sb-lg bg-sb-paper px-4 py-4 active:scale-[0.98] transition-transform"
                style={{
                  boxShadow: pack.badgeKey
                    ? "inset 0 0 0 2px var(--sb-olive), var(--shadow-sb-card)"
                    : "var(--shadow-sb-card), inset 0 0 0 1px rgba(91,74,54,0.08)",
                }}
              >
                <div className="flex items-start justify-between">
                  <YuzuStack count={Math.min(pack.count, 5)} />
                  {pack.badgeKey && (
                    <span
                      className="rounded-full px-2 py-[3px] text-[10px] font-extrabold"
                      style={{ background: "var(--sb-yuzu)", color: "var(--sb-olive-dark)" }}
                    >
                      {t(pack.badgeKey)}
                    </span>
                  )}
                </div>
                <h3 className="mt-4 text-[17px] font-extrabold text-sb-ink">
                  {t(pack.titleKey)}
                </h3>
                <p className="mt-1 min-h-[32px] text-[11.5px] font-semibold leading-snug text-sb-ink-2">
                  {t(pack.descriptionKey)}
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
          <h2 className="text-[14px] font-extrabold text-sb-ink">
            {t("charge.policyTitle")}
          </h2>
          <ul className="mt-3 flex flex-col gap-2 text-[12px] font-semibold leading-relaxed text-sb-ink-2">
            <li>{t("charge.policy.one")}</li>
            <li>{t("charge.policy.two")}</li>
            <li>{t("charge.policy.three")}</li>
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
