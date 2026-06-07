"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import BusinessInfoPanel from "@/app/components/BusinessInfoPanel";
import {
  MOCK_ENTITLEMENT_COOKIE,
  mergeMockEntitlements,
  mergeMockPurchase,
  parseMockEntitlements,
  serializeMockEntitlements,
  type MockEntitlements,
  type MockPlanId,
} from "@/lib/auth/mock-entitlements";
import {
  appendCheckoutOptionToReturnTo,
  buildCheckoutOptions,
  formatWon,
  type CheckoutOption,
} from "@/lib/payments/checkout-options";
import { currentKstYear } from "@/lib/saju/report-links";

type MockCheckoutClientProps = {
  amount: number;
  initialEntitlements: MockEntitlements;
  product: string;
  returnTo: string;
  title: string;
};

type Step = "ready" | "processing" | "done";

export default function MockCheckoutClient({
  amount,
  initialEntitlements,
  product,
  returnTo,
  title,
}: MockCheckoutClientProps) {
  const [step, setStep] = useState<Step>("ready");
  const [entitlements, setEntitlements] = useState<MockEntitlements>(() =>
    initialEntitlements,
  );
  const redirectStartedRef = useRef(false);

  useEffect(() => {
    /* eslint-disable react-hooks/set-state-in-effect */
    setEntitlements(
      mergeMockEntitlements(
        initialEntitlements,
        parseMockEntitlements(readCookie(MOCK_ENTITLEMENT_COOKIE)),
      ),
    );
    /* eslint-enable react-hooks/set-state-in-effect */
  }, [initialEntitlements]);

  const options = useMemo<CheckoutOption[]>(
    () =>
      buildCheckoutOptions({ amount, entitlements, product, returnTo, title }),
    [amount, entitlements, product, returnTo, title],
  );
  const [selectedId, setSelectedId] = useState<CheckoutOption["id"]>("today-pack");
  const selected = options.find((o) => o.id === selectedId) ?? options[0];
  const hasMultipleOptions = options.length > 1;

  useEffect(() => {
    if (options.some((option) => option.id === selectedId)) return;
    const recommended = options.find((option) => option.badge) ?? options[0];
    /* eslint-disable react-hooks/set-state-in-effect */
    setSelectedId(recommended.id);
    /* eslint-enable react-hooks/set-state-in-effect */
  }, [options, selectedId]);

  const formattedAmount = useMemo(
    () => new Intl.NumberFormat("ko-KR").format(selected.amount),
    [selected.amount],
  );
  const returnToWithPlan = useMemo(
    () => appendCheckoutOptionToReturnTo(returnTo, selected),
    [returnTo, selected],
  );

  useEffect(() => {
    if (step !== "processing") return;
    const doneTimer = window.setTimeout(() => setStep("done"), 850);

    return () => {
      window.clearTimeout(doneTimer);
    };
  }, [step]);

  useEffect(() => {
    if (step !== "done") return;
    if (redirectStartedRef.current) return;
    redirectStartedRef.current = true;

    try {
      saveMockEntitlement({
        plan: selected.id,
        product,
        amount: selected.amount,
        returnTo,
      });
    } catch (error) {
      console.error("[barasaju] mock entitlement save failed", error);
    }

    const redirectTimer = window.setTimeout(() => {
      window.location.replace(returnToWithPlan);
    }, 450);

    return () => {
      window.clearTimeout(redirectTimer);
    };
  }, [product, returnTo, returnToWithPlan, selected.amount, selected.id, step]);

  const label =
    step === "ready"
      ? hasMultipleOptions
        ? "어떤 해설로 열어볼까요?"
        : "구매 내용을 확인해주세요"
      : step === "processing"
        ? "테스트 결제를 승인하는 중이에요"
        : "결제가 완료되었어요";

  const busy = step !== "ready";
  const introCopy = hasMultipleOptions
    ? "실제 돈은 결제되지 않습니다. 지금은 객단가 옵션과 결제 후 잠금 해제 흐름만 확인합니다."
    : "실제 돈은 결제되지 않습니다. 선택한 해설과 금액만 확인한 뒤 테스트 결제 흐름을 진행합니다.";

  return (
    <main className="min-h-dvh bg-[#EAE3D0] flex justify-center">
      <div className="sb-app-shell h-dvh w-full max-w-[420px] flex flex-col min-h-0">
        <header
          className="px-5 pt-5 pb-4 shrink-0"
          style={{
            background: "rgba(255, 248, 232, 0.9)",
            borderBottom: "1px solid var(--sb-hairline)",
          }}
        >
          <Link
            href={returnTo.replace(/[?&]paid=1\b/, "")}
            className="inline-flex h-9 items-center rounded-full bg-sb-paper px-3 text-[13px] font-bold text-sb-ink-2"
            style={{ boxShadow: "inset 0 0 0 1px var(--sb-hairline)" }}
          >
            이전으로
          </Link>
        </header>

        <section className="flex-1 min-h-0 overflow-y-auto px-5 pt-8 pb-[calc(2rem+env(safe-area-inset-bottom))] flex flex-col">
          <div
            className="rounded-sb-xl bg-sb-paper px-5 py-6"
            style={{
              boxShadow: "var(--shadow-sb-card), inset 0 0 0 1px rgba(91,74,54,0.08)",
            }}
          >
            <div className="mb-5 inline-flex rounded-full bg-sb-cream px-3 py-1 text-[11px] font-extrabold text-sb-terra-dark">
              테스트 결제
            </div>

            <h1 className="text-[24px] font-extrabold leading-tight text-sb-ink">
              {label}
            </h1>
            <p className="mt-3 text-[13px] font-semibold leading-relaxed text-sb-ink-2">
              {introCopy}
            </p>

            {hasMultipleOptions ? (
              <div className="mt-6 flex flex-col gap-2.5">
                {options.map((option) => {
                  const active = option.id === selected.id;
                  return (
                    <button
                      key={option.id}
                      type="button"
                      disabled={busy}
                      aria-pressed={active}
                      onClick={() => setSelectedId(option.id)}
                      className="w-full rounded-sb-lg px-4 py-3 text-left transition-transform active:scale-[0.99] disabled:opacity-70"
                      style={{
                        background: active ? "var(--sb-cream)" : "var(--sb-paper)",
                        boxShadow: active
                          ? "inset 0 0 0 2px var(--sb-olive), 0 5px 16px rgba(92,110,62,0.12)"
                          : "inset 0 0 0 1px var(--sb-hairline)",
                      }}
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div className="min-w-0">
                          <div className="flex items-center gap-1.5">
                            <h2 className="text-[14px] font-extrabold text-sb-ink tracking-tight">
                              {option.title}
                            </h2>
                            {option.badge && (
                              <span
                                className="rounded-full px-1.5 py-[2px] text-[9px] font-extrabold"
                                style={{
                                  background: "var(--sb-yuzu)",
                                  color: "var(--sb-olive-dark)",
                                }}
                              >
                                {option.badge}
                              </span>
                            )}
                          </div>
                          <p className="mt-1 text-[11.5px] font-semibold text-sb-ink-2 leading-snug">
                            {option.subtitle}
                          </p>
                        </div>
                        <div className="shrink-0 text-right">
                          {option.creditAmount > 0 && (
                            <p className="text-[11px] font-bold text-sb-ink-3 line-through">
                              ₩{formatWon(option.baseAmount)}
                            </p>
                          )}
                          <p className="text-[15px] font-extrabold text-sb-olive-dark">
                            ₩{formatWon(option.amount)}
                          </p>
                          <span
                            className="mt-1 inline-flex h-4 w-4 rounded-full"
                            style={{
                              background: active ? "var(--sb-olive)" : "transparent",
                              boxShadow: active
                                ? "inset 0 0 0 4px var(--sb-paper)"
                                : "inset 0 0 0 1.5px var(--sb-hairline)",
                            }}
                            aria-hidden
                          />
                        </div>
                      </div>
                      <ul className="mt-2 flex flex-wrap gap-1.5">
                        {option.features.map((feature) => (
                          <li
                            key={feature}
                            className="rounded-full px-2 py-[3px] text-[10.5px] font-bold text-sb-ink-2"
                            style={{ background: "rgba(255,253,245,0.72)" }}
                          >
                            {feature}
                          </li>
                        ))}
                        {option.ownedLabels.length > 0 && (
                          <li
                            className="rounded-full px-2 py-[3px] text-[10.5px] font-extrabold text-sb-olive-dark"
                            style={{ background: "rgba(92,110,62,0.12)" }}
                          >
                            이미 보유: {option.ownedLabels.join(" · ")}
                          </li>
                        )}
                      </ul>
                    </button>
                  );
                })}
              </div>
            ) : (
              <div
                className="mt-6 rounded-sb-lg px-4 py-4"
                style={{
                  background: "var(--sb-cream)",
                  boxShadow: "inset 0 0 0 1px var(--sb-hairline)",
                }}
              >
                <div className="flex items-start justify-between gap-4">
                  <div className="min-w-0">
                    <p className="text-[11px] font-extrabold text-sb-ink-3">
                      구매 상품
                    </p>
                    <h2 className="mt-1 text-[17px] font-extrabold leading-tight text-sb-ink">
                      {selected.title}
                    </h2>
                    <p className="mt-1 text-[12px] font-semibold leading-snug text-sb-ink-2">
                      {selected.subtitle}
                    </p>
                  </div>
                  <p className="shrink-0 text-[19px] font-extrabold text-sb-olive-dark">
                    ₩{formattedAmount}
                  </p>
                </div>
                <ul className="mt-3 flex flex-wrap gap-1.5">
                  {selected.features.map((feature) => (
                    <li
                      key={feature}
                      className="rounded-full px-2 py-[3px] text-[10.5px] font-bold text-sb-ink-2"
                      style={{ background: "rgba(255,253,245,0.72)" }}
                    >
                      {feature}
                    </li>
                  ))}
                </ul>
                {selected.creditAmount > 0 && (
                  <p
                    className="mt-3 rounded-full px-3 py-2 text-[11px] font-extrabold text-sb-olive-dark"
                    style={{ background: "rgba(92,110,62,0.12)" }}
                  >
                    이미 구매한 해설 ₩{formatWon(selected.creditAmount)}을 차감했어요.
                  </p>
                )}
              </div>
            )}

            {hasMultipleOptions && (
              <div
                className="mt-6 rounded-sb-lg px-4 py-4"
                style={{
                  background: "var(--sb-cream)",
                  boxShadow: "inset 0 0 0 1px var(--sb-hairline)",
                }}
              >
                <div className="flex items-center justify-between gap-4">
                  <div>
                    <p className="text-[11px] font-extrabold text-sb-ink-3">
                      선택한 상품
                    </p>
                    <p className="mt-1 text-[15px] font-extrabold text-sb-ink">
                      {selected.title}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="text-[11px] font-extrabold text-sb-ink-3">
                      금액
                    </p>
                    <p className="mt-1 text-[17px] font-extrabold text-sb-olive-dark">
                      ₩{formattedAmount}
                    </p>
                  </div>
                </div>
                {selected.creditAmount > 0 && (
                  <p
                    className="mt-3 rounded-full px-3 py-2 text-[11px] font-extrabold text-sb-olive-dark"
                    style={{ background: "rgba(92,110,62,0.12)" }}
                  >
                    이미 구매한 해설 ₩{formatWon(selected.creditAmount)}을 차감했어요.
                  </p>
                )}
                <p className="mt-3 text-[10.5px] font-semibold text-sb-ink-3">
                  scope: {product}
                </p>
              </div>
            )}

            <div className="mt-7 flex items-center gap-2">
              {(["ready", "processing", "done"] as Step[]).map((item, index) => {
                const activeIndex =
                  step === "ready" ? 0 : step === "processing" ? 1 : 2;
                const active = index <= activeIndex;
                return (
                  <div
                    key={item}
                    className="h-2 flex-1 rounded-full"
                    style={{
                      background: active ? "var(--sb-yuzu-dark)" : "rgba(91,74,54,0.12)",
                    }}
                  />
                );
              })}
            </div>

            <button
              type="button"
              disabled={step === "processing"}
              onClick={() => {
                if (step === "done") {
                  window.location.assign(returnToWithPlan);
                  return;
                }
                setStep("processing");
              }}
              className="mt-7 h-12 w-full rounded-full text-[14px] font-extrabold text-sb-olive-dark"
              style={{
                background:
                  "linear-gradient(135deg, var(--sb-yuzu-light), var(--sb-yuzu) 62%, var(--sb-yuzu-dark))",
                boxShadow: "0 4px 14px rgba(216,154,42,0.36)",
              }}
            >
              {step === "done"
                ? "결과 페이지로 이동 중이에요"
                : busy
                  ? label
                  : selected.amount === 0
                    ? "이미 열려 있어요 · 결과 보기"
                    : `테스트 결제하기 · ₩${formattedAmount}`}
            </button>
            {step === "done" && (
              <Link
                href={returnToWithPlan}
                className="mt-2 flex h-10 w-full items-center justify-center rounded-full text-[12px] font-bold text-sb-ink-3 underline underline-offset-2"
              >
                결과 바로 보기
              </Link>
            )}
          </div>
          <div className="mt-5">
            <BusinessInfoPanel compact />
          </div>

          <p className="mt-auto pt-6 text-center text-[11px] font-semibold text-sb-ink-3">
            실제 결제 연동 시 이 화면은 PG 승인 대기 화면으로 교체됩니다.
          </p>
        </section>
      </div>
    </main>
  );
}

function saveMockEntitlement({
  plan,
  product,
  amount,
  returnTo,
}: {
  plan: MockPlanId;
  product: string;
  amount: number;
  returnTo: string;
}) {
  const current = parseMockEntitlements(readCookie(MOCK_ENTITLEMENT_COOKIE));
  const entitlements = mergeMockPurchase({
    current,
    plan,
    product,
    amount,
    returnTo,
    nowYear: currentKstYear(),
  });
  const maxAge = 60 * 60 * 24 * 90;
  document.cookie = `${MOCK_ENTITLEMENT_COOKIE}=${serializeMockEntitlements(
    entitlements,
  )}; Path=/; Max-Age=${maxAge}; SameSite=Lax`;
}

function readCookie(name: string): string | undefined {
  if (typeof document === "undefined") return undefined;
  const prefix = `${name}=`;
  return document.cookie
    .split(";")
    .map((item) => item.trim())
    .find((item) => item.startsWith(prefix))
    ?.slice(prefix.length);
}
