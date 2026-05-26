import Link from "next/link";
import { sanitizeReturnTo } from "@/lib/payments/checkout";
import PortOneCompleteClient from "./PortOneCompleteClient";

type SearchParams = Promise<{
  amount?: string;
  code?: string;
  message?: string;
  paymentId?: string;
  plan?: string;
  product?: string;
  returnTo?: string;
  title?: string;
}>;

export default async function PortOneCompletePage({
  searchParams,
}: {
  searchParams: SearchParams;
}) {
  const sp = await searchParams;
  const returnTo = sanitizeReturnTo(sp.returnTo);
  const amount = Number(sp.amount ?? 0);

  if (sp.code) {
    return (
      <main className="flex min-h-dvh justify-center bg-[#EAE3D0]">
        <div className="sb-app-shell flex h-dvh w-full max-w-[420px] flex-col">
          <section className="flex flex-1 items-center px-5">
            <div className="w-full rounded-sb-xl bg-sb-paper px-5 py-6 text-center shadow-sb-card">
              <p className="text-[11px] font-extrabold uppercase tracking-[0.16em] text-sb-terra">
                Payment canceled
              </p>
              <h1 className="mt-3 text-[24px] font-extrabold text-sb-ink">
                결제가 완료되지 않았어요
              </h1>
              <p className="mt-3 text-[13px] font-semibold leading-relaxed text-sb-ink-2">
                {sp.message ?? "결제가 취소되었거나 실패했습니다. 다시 시도해 주세요."}
              </p>
              <Link
                href={returnTo}
                className="mt-6 inline-flex h-12 w-full items-center justify-center rounded-full bg-sb-yuzu text-[14px] font-extrabold text-sb-olive-dark"
              >
                돌아가기
              </Link>
            </div>
          </section>
        </div>
      </main>
    );
  }

  return (
    <PortOneCompleteClient
      amount={amount}
      paymentId={sp.paymentId ?? ""}
      plan={sp.plan ?? "single"}
      product={sp.product ?? ""}
      returnTo={returnTo}
      title={sp.title ?? "사주바라 해설"}
    />
  );
}
