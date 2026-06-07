import Link from "next/link";
import { T } from "@/app/components/LanguageProvider";
import LanguageSwitcher from "@/app/components/LanguageSwitcher";
import TodayFortuneClient from "@/app/components/TodayFortuneClient";
import { todayLunarLabel } from "@/lib/saju/today";

type SearchParams = Promise<{
  date?: string;
  purpose?: string;
  memo?: string;
  paid?: string;
}>;

export default async function TodayPage({
  searchParams,
}: {
  searchParams: SearchParams;
}) {
  const sp = await searchParams;
  return (
    <>
      <Header />
      <TodayFortuneClient
        dateLabel={{
          ko: formatKstDate("ko"),
          en: formatKstDate("en"),
        }}
        lunarLabel={{
          ko: todayLunarLabel("ko"),
          en: todayLunarLabel("en"),
        }}
        initialDate={sp.date}
        initialPurpose={sp.purpose}
        initialMemo={sp.memo}
        initialPaid={sp.paid === "1"}
      />
    </>
  );
}

function Header() {
  return (
    <header
      className="flex items-center justify-between px-5 pt-3 pb-3 shrink-0"
      style={{
        background: "rgba(255, 248, 232, 0.9)",
        backdropFilter: "blur(20px) saturate(180%)",
        WebkitBackdropFilter: "blur(20px) saturate(180%)",
        borderBottom: "1px solid var(--sb-hairline)",
      }}
    >
      <Link
        href="/"
        className="h-9 w-9 rounded-full bg-sb-paper flex items-center justify-center"
        style={{ boxShadow: "inset 0 0 0 1px var(--sb-hairline)" }}
        aria-label="Home"
      >
        <svg width="12" height="12" viewBox="0 0 12 12" fill="none" aria-hidden>
          <path
            d="M8 2L4 6L8 10"
            stroke="var(--sb-ink-2)"
            strokeWidth="1.8"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      </Link>
      <div className="text-center">
        <h1 className="text-[17px] font-extrabold text-sb-olive-dark">
          <T k="today.title" />
        </h1>
        <p className="mt-[2px] text-[10px] font-semibold text-sb-ink-3">
          <T k="today.subtitle" />
        </p>
      </div>
      <div className="flex items-center gap-1.5">
        <LanguageSwitcher compact />
        <Link
          href="/people"
          className="h-9 rounded-full bg-sb-paper px-3 flex items-center justify-center text-[12px] font-extrabold text-sb-ink-2"
          style={{ boxShadow: "inset 0 0 0 1px var(--sb-hairline)" }}
        >
          <T k="common.person" />
        </Link>
      </div>
    </header>
  );
}

function formatKstDate(locale: "ko" | "en") {
  const now = new Date();
  if (locale === "en") {
    return new Intl.DateTimeFormat("en-US", {
      timeZone: "Asia/Seoul",
      month: "short",
      day: "numeric",
      weekday: "short",
    }).format(now);
  }

  const parts = new Intl.DateTimeFormat("ko-KR", {
    timeZone: "Asia/Seoul",
    month: "numeric",
    day: "numeric",
    weekday: "short",
  }).formatToParts(now);
  const month = parts.find((p) => p.type === "month")?.value ?? "";
  const day = parts.find((p) => p.type === "day")?.value ?? "";
  const weekday = parts.find((p) => p.type === "weekday")?.value ?? "";
  return `${month}/${day} ${weekday}`;
}
