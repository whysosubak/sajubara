"use client";

import { requestPayment, type PaymentPayMethod } from "@portone/browser-sdk/v2";
import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import BusinessInfoPanel from "@/app/components/BusinessInfoPanel";
import {
  MOCK_ENTITLEMENT_COOKIE,
  mergeMockEntitlements,
  parseMockEntitlements,
  type MockEntitlements,
} from "@/lib/auth/mock-entitlements";
import {
  appendCheckoutOptionToReturnTo,
  buildCheckoutOptions,
  formatWon,
  type CheckoutOption,
} from "@/lib/payments/checkout-options";

type PortOneCheckoutClientProps = {
  amount: number;
  channelKey: string;
  initialEntitlements: MockEntitlements;
  payMethod: string;
  product: string;
  returnTo: string;
  storeId: string;
  title: string;
};

type Step = "ready" | "processing" | "verifying" | "error";

export default function PortOneCheckoutClient({
  amount,
  channelKey,
  initialEntitlements,
  payMethod,
  product,
  returnTo,
  storeId,
  title,
}: PortOneCheckoutClientProps) {
  const [step, setStep] = useState<Step>("ready");
  const [errorMessage, setErrorMessage] = useState("");
  const [entitlements, setEntitlements] = useState<MockEntitlements>(() =>
    initialEntitlements,
  );

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

  const options = useMemo(
    () =>
      buildCheckoutOptions({
        amount,
        entitlements,
        product,
        returnTo,
        title,
      }),
    [amount, entitlements, product, returnTo, title],
  );
  const [selectedId, setSelectedId] = useState<CheckoutOption["id"]>("today-pack");
  const selected = options.find((option) => option.id === selectedId) ?? options[0];
  const hasMultipleOptions = options.length > 1;
  const returnToWithPlan = useMemo(
    () => appendCheckoutOptionToReturnTo(returnTo, selected),
    [returnTo, selected],
  );

  useEffect(() => {
    if (options.some((option) => option.id === selectedId)) return;
    const recommended = options.find((option) => option.badge) ?? options[0];
    /* eslint-disable react-hooks/set-state-in-effect */
    setSelectedId(recommended.id);
    /* eslint-enable react-hooks/set-state-in-effect */
  }, [options, selectedId]);

  async function startPayment() {
    if (selected.amount === 0) {
      window.location.assign(returnToWithPlan);
      return;
    }
    if (!storeId || !channelKey) {
      setStep("error");
      setErrorMessage(
        "포트원 상점 ID 또는 채널 키가 비어 있어요. 환경변수를 설정한 뒤 다시 시도해주세요.",
      );
      return;
    }

    setStep("processing");
    setErrorMessage("");
    const paymentId = `barasaju-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
    const completionParams = new URLSearchParams({
      amount: String(selected.amount),
      paymentId,
      plan: selected.id,
      product,
      returnTo,
      title: selected.title,
    });
    const redirectUrl = `${window.location.origin}/checkout/portone/complete?${completionParams.toString()}`;

    try {
      const response = await requestPayment({
        storeId,
        channelKey,
        paymentId,
        orderName: selected.title,
        totalAmount: selected.amount,
        currency: "KRW",
        payMethod: payMethod as PaymentPayMethod,
        redirectUrl,
        customData: {
          plan: selected.id,
          product,
          returnTo,
        },
      });

      if (!response) {
        setStep("ready");
        return;
      }

      if (response.code) {
        setStep("error");
        setErrorMessage(response.message ?? "결제가 취소되었거나 실패했어요.");
        return;
      }

      setStep("verifying");
      await completePayment({
        amount: selected.amount,
        paymentId: response.paymentId,
        plan: selected.id,
        product,
        returnTo,
      });
    } catch (error) {
      setStep("error");
      setErrorMessage(error instanceof Error ? error.message : "결제창 호출에 실패했어요.");
    }
  }

  const busy = step === "processing" || step === "verifying";
  const formattedAmount = formatWon(selected.amount);
  const readyHeading = hasMultipleOptions
    ? "어떤 해설로 열어볼까요?"
    : "구매 내용을 확인해주세요";
  const readyCopy = hasMultipleOptions
    ? "선택한 상품으로 포트원 결제창을 호출하고, 승인 금액을 서버에서 확인한 뒤 잠금을 해제합니다."
    : "선택한 해설과 금액을 확인한 뒤 포트원 결제창으로 이동합니다.";

  return (
    <main className="flex min-h-dvh justify-center bg-[#EAE3D0]">
      <div className="sb-app-shell flex h-dvh min-h-0 w-full max-w-[420px] flex-col">
        <header
          className="shrink-0 px-5 pb-4 pt-5"
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

        <section className="flex min-h-0 flex-1 flex-col overflow-y-auto px-5 pb-[calc(2rem+env(safe-area-inset-bottom))] pt-8">
          <div
            className="rounded-sb-xl bg-sb-paper px-5 py-6"
            style={{
              boxShadow: "var(--shadow-sb-card), inset 0 0 0 1px rgba(91,74,54,0.08)",
            }}
          >
            <div className="mb-5 inline-flex rounded-full bg-sb-cream px-3 py-1 text-[11px] font-extrabold text-sb-terra-dark">
              실결제
            </div>
            <h1 className="text-[24px] font-extrabold leading-tight text-sb-ink">
              {readyHeading}
            </h1>
            <p className="mt-3 text-[13px] font-semibold leading-relaxed text-sb-ink-2">
              {readyCopy}
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
                            <h2 className="text-[14px] font-extrabold tracking-tight text-sb-ink">
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
                          <p className="mt-1 text-[11.5px] font-semibold leading-snug text-sb-ink-2">
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
                            aria-hidden
                            className="mt-1 inline-flex h-4 w-4 rounded-full"
                            style={{
                              background: active ? "var(--sb-olive)" : "transparent",
                              boxShadow: active
                                ? "inset 0 0 0 4px var(--sb-paper)"
                                : "inset 0 0 0 1.5px var(--sb-hairline)",
                            }}
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

            {errorMessage && (
              <p className="mt-5 rounded-sb-md bg-[#F8E2D7] px-3 py-2 text-[12px] font-bold leading-relaxed text-sb-terra-dark">
                {errorMessage}
              </p>
            )}

            <button
              type="button"
              disabled={busy}
              onClick={startPayment}
              className="mt-7 h-12 w-full rounded-full text-[14px] font-extrabold text-sb-olive-dark disabled:opacity-70"
              style={{
                background:
                  "linear-gradient(135deg, var(--sb-yuzu-light), var(--sb-yuzu) 62%, var(--sb-yuzu-dark))",
                boxShadow: "0 4px 14px rgba(216,154,42,0.36)",
              }}
            >
              {step === "processing"
                ? "결제창을 여는 중이에요"
                : step === "verifying"
                  ? "결제를 확인하는 중이에요"
                  : selected.amount === 0
                    ? "이미 열려 있어요 · 결과 보기"
                    : `결제하기 · ₩${formattedAmount}`}
            </button>
          </div>
          <div className="mt-5">
            <BusinessInfoPanel compact />
          </div>
        </section>
      </div>
    </main>
  );
}

async function completePayment({
  amount,
  paymentId,
  plan,
  product,
  returnTo,
}: {
  amount: number;
  paymentId: string;
  plan: CheckoutOption["id"];
  product: string;
  returnTo: string;
}) {
  const response = await fetch("/api/payments/portone/complete", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ amount, paymentId, plan, product, returnTo }),
  });
  const body = (await response.json().catch(() => null)) as
    | { error?: string; redirectTo?: string }
    | null;
  if (!response.ok || !body?.redirectTo) {
    throw new Error(body?.error ?? "결제 검증에 실패했어요.");
  }
  window.location.replace(body.redirectTo);
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
