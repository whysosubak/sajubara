import Link from "next/link";
import type { ReportAccessItem } from "@/lib/auth/report-access";

export default function ReportAccessPanel({
  items,
  title = "오늘의 바라팩 이어보기",
}: {
  items: ReportAccessItem[];
  title?: string;
}) {
  if (items.length === 0) return null;
  const unlockedCount = items.filter((item) => item.unlocked).length;

  return (
    <section
      className="sb-print-hidden rounded-sb-xl bg-sb-paper px-4 py-4"
      style={{
        boxShadow: "var(--shadow-sb-card), inset 0 0 0 1px rgba(91,74,54,0.06)",
      }}
    >
      <div className="mb-3 flex items-start justify-between gap-3">
        <div>
          <div className="text-[10.5px] font-extrabold text-sb-olive-dark tracking-wider uppercase">
            구매한 리포트
          </div>
          <h2 className="mt-0.5 text-[16px] font-extrabold text-sb-ink tracking-tight">
            {title}
          </h2>
          <p className="mt-1 text-[11.5px] font-semibold leading-relaxed text-sb-ink-3">
            어디서 결제했든 열린 세트는 여기서 바로 이어볼 수 있어요.
          </p>
        </div>
        <span
          className="shrink-0 rounded-full px-2.5 py-1 text-[10px] font-extrabold"
          style={{
            background: "var(--sb-cream)",
            color: "var(--sb-olive-dark)",
            boxShadow: "inset 0 0 0 1px var(--sb-hairline)",
          }}
        >
          {unlockedCount}/{items.length} 열림
        </span>
      </div>

      <div className="flex flex-col gap-2">
        {items.map((item) => {
          const href = item.unlocked ? item.href : item.checkoutHref;
          return (
            <Link
              key={item.key}
              href={href}
              className="flex items-center gap-3 rounded-sb-lg px-3.5 py-3 active:scale-[0.99] transition-transform"
              style={{
                background: item.unlocked ? "var(--sb-cream)" : "rgba(255,253,245,0.72)",
                boxShadow: item.unlocked
                  ? "inset 0 0 0 1.5px rgba(92,110,62,0.22)"
                  : "inset 0 0 0 1px var(--sb-hairline)",
              }}
            >
              <span
                className="flex h-10 w-10 shrink-0 items-center justify-center rounded-sb-md text-[20px]"
                style={{
                  background: item.unlocked ? "rgba(255,255,255,0.52)" : "var(--sb-cream)",
                }}
                aria-hidden
              >
                {item.icon}
              </span>
              <span className="min-w-0 flex-1">
                <span className="block text-[13.5px] font-extrabold leading-tight text-sb-ink">
                  {item.title}
                </span>
                <span className="mt-0.5 block text-[11px] font-semibold leading-snug text-sb-ink-3">
                  {item.description}
                </span>
              </span>
              <span
                className="shrink-0 rounded-full px-2 py-1 text-[10px] font-extrabold"
                style={{
                  background: item.unlocked ? "var(--sb-olive)" : "var(--sb-paper)",
                  color: item.unlocked ? "white" : "var(--sb-terra-dark)",
                  boxShadow: "inset 0 0 0 1px rgba(91,74,54,0.08)",
                }}
              >
                {item.unlocked ? "보기" : "잠금"}
              </span>
            </Link>
          );
        })}
      </div>
    </section>
  );
}
