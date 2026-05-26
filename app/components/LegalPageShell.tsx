import Link from "next/link";
import type { ReactNode } from "react";

type LegalPageShellProps = {
  title: string;
  description: string;
  updatedAt: string;
  children: ReactNode;
};

export default function LegalPageShell({
  title,
  description,
  updatedAt,
  children,
}: LegalPageShellProps) {
  return (
    <main className="sb-app-shell h-dvh w-full max-w-[420px] mx-auto overflow-y-auto bg-sb-bg">
      <header
        className="sticky top-0 z-10 flex items-center justify-between px-5 pt-3 pb-2"
        style={{
          background: "rgba(255, 248, 232, 0.88)",
          backdropFilter: "blur(20px) saturate(180%)",
          WebkitBackdropFilter: "blur(20px) saturate(180%)",
          borderBottom: "1px solid var(--sb-hairline)",
        }}
      >
        <Link
          href="/"
          className="h-9 px-3 rounded-full bg-sb-paper flex items-center gap-1.5 text-[13px] font-bold text-sb-ink-2"
          style={{ boxShadow: "inset 0 0 0 1px var(--sb-hairline)" }}
        >
          <span aria-hidden>‹</span>
          홈
        </Link>
        <span className="text-[15px] font-extrabold text-sb-olive-dark">
          {title}
        </span>
        <div className="w-[54px]" />
      </header>

      <article className="px-5 pt-5 pb-10">
        <section
          className="rounded-sb-xl bg-sb-paper px-5 py-5"
          style={{
            boxShadow: "var(--shadow-sb-hero), inset 0 0 0 1px rgba(91,74,54,0.06)",
          }}
        >
          <p className="text-[10.5px] font-extrabold uppercase tracking-[0.16em] text-sb-olive-light">
            Sajubara Policy
          </p>
          <h1 className="mt-2 text-[25px] font-extrabold leading-tight text-sb-ink">
            {title}
          </h1>
          <p className="mt-3 text-[13px] font-semibold leading-relaxed text-sb-ink-2">
            {description}
          </p>
          <p className="mt-4 rounded-full bg-sb-cream px-3 py-2 text-[11px] font-bold text-sb-ink-3">
            시행일 및 최종 업데이트: {updatedAt}
          </p>
        </section>

        <div className="mt-4 flex flex-col gap-3">{children}</div>
      </article>
    </main>
  );
}

export function LegalSection({
  title,
  children,
}: {
  title: string;
  children: ReactNode;
}) {
  return (
    <section
      className="rounded-sb-lg bg-sb-paper px-4 py-4"
      style={{
        boxShadow: "var(--shadow-sb-card), inset 0 0 0 1px rgba(91,74,54,0.06)",
      }}
    >
      <h2 className="text-[15px] font-extrabold text-sb-ink">{title}</h2>
      <div className="mt-2 text-[12.5px] font-semibold leading-relaxed text-sb-ink-2">
        {children}
      </div>
    </section>
  );
}
