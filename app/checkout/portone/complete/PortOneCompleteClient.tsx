"use client";

import Link from "next/link";
import { useEffect, useState } from "react";

type PortOneCompleteClientProps = {
  amount: number;
  paymentId: string;
  plan: string;
  product: string;
  returnTo: string;
  title: string;
};

export default function PortOneCompleteClient({
  amount,
  paymentId,
  plan,
  product,
  returnTo,
  title,
}: PortOneCompleteClientProps) {
  const [errorMessage, setErrorMessage] = useState("");

  useEffect(() => {
    let alive = true;

    async function verify() {
      if (!paymentId || !product || !amount) {
        if (alive) setErrorMessage("결제 검증에 필요한 정보가 부족합니다.");
        return;
      }

      try {
        const response = await fetch("/api/payments/portone/complete", {
          body: JSON.stringify({
            amount,
            paymentId,
            plan,
            product,
            returnTo,
          }),
          headers: { "Content-Type": "application/json" },
          method: "POST",
        });
        const data = (await response.json()) as { error?: string; redirectTo?: string };
        if (!response.ok || !data.redirectTo) {
          throw new Error(data.error ?? "결제 검증에 실패했어요.");
        }
        window.location.assign(data.redirectTo);
      } catch (error) {
        if (alive) {
          setErrorMessage(error instanceof Error ? error.message : "결제 검증에 실패했어요.");
        }
      }
    }

    void verify();
    return () => {
      alive = false;
    };
  }, [amount, paymentId, plan, product, returnTo]);

  return (
    <main className="flex min-h-dvh justify-center bg-[#EAE3D0]">
      <div className="sb-app-shell flex h-dvh w-full max-w-[420px] flex-col">
        <section className="flex flex-1 items-center px-5">
          <div className="w-full rounded-sb-xl bg-sb-paper px-5 py-7 text-center shadow-sb-card">
            <div
              className="mx-auto h-16 w-16 rounded-full"
              style={{
                background:
                  "radial-gradient(circle at 35% 30%, #fff8dc 0 20%, #f6c141 58%, #d9951e 100%)",
                boxShadow: "0 14px 32px rgba(217,149,30,0.24)",
              }}
            />
            <p className="mt-5 text-[11px] font-extrabold uppercase tracking-[0.16em] text-sb-terra">
              Payment verifying
            </p>
            <h1 className="mt-3 text-[24px] font-extrabold leading-tight text-sb-ink">
              {errorMessage ? "결제 확인이 필요해요" : "결제를 확인하는 중이에요"}
            </h1>
            <p className="mt-3 text-[13px] font-semibold leading-relaxed text-sb-ink-2">
              {errorMessage || `${title} 결제 내역을 확인하고 잠금을 해제하고 있어요.`}
            </p>
            {errorMessage ? (
              <Link
                href={returnTo}
                className="mt-6 inline-flex h-12 w-full items-center justify-center rounded-full bg-sb-yuzu text-[14px] font-extrabold text-sb-olive-dark"
              >
                돌아가기
              </Link>
            ) : (
              <div className="mt-6 h-2 overflow-hidden rounded-full bg-sb-cream">
                <div className="h-full w-1/2 animate-pulse rounded-full bg-sb-yuzu" />
              </div>
            )}
          </div>
        </section>
      </div>
    </main>
  );
}
