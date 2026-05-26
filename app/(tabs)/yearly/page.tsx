import Link from "next/link";
import { Suspense } from "react";
import StickyPaywallLink from "@/app/components/StickyPaywallLink";
import { canViewPaidContent } from "@/lib/auth/paid";
import { checkoutHref } from "@/lib/payments/checkout";
import { computeChart, type SajuChart } from "@/lib/saju/chart";
import {
  generateYearlyOverview,
  type YearListItem,
  type YearlyOverview,
} from "@/lib/saju/generate";
import { currentKstYear } from "@/lib/saju/report-links";
import { sajuPersonKey } from "@/lib/saju/scope";
import type {
  CalendarType,
  Gender,
  JobStatus,
  LoveStatus,
  SajuInput,
} from "@/lib/saju/types";
import { JOB_STATUSES, LOVE_STATUSES } from "@/lib/saju/types";

type SearchParams = Promise<{
  name?: string;
  birthDate?: string;
  birthTime?: string;
  gender?: string;
  calendar?: string;
  loveStatus?: string;
  jobStatus?: string;
  paid?: string;
}>;

export default async function YearlyPage({
  searchParams,
}: {
  searchParams: SearchParams;
}) {
  const sp = await searchParams;
  const input = parseInput(sp);
  const currentYear = currentKstYear();
  const isPaid = input
    ? await canViewPaidContent(sp.paid === "1", {
        product: "yearly",
        year: currentYear,
        personKey: sajuPersonKey(input),
      })
    : false;
  const qs = inputToQs(sp);

  return (
    <>
      <Header />
      <div className="flex-1 overflow-y-auto pb-36">
        {!input ? <EmptyState /> : <YearlyBody input={input} isPaid={isPaid} qs={qs} />}
      </div>
      {input && !isPaid && <StickyPaywall qs={qs} year={currentYear} input={input} />}
    </>
  );
}

async function YearlyBody({
  input,
  isPaid,
  qs,
}: {
  input: SajuInput;
  isPaid: boolean;
  qs: string;
}) {
  let chart: SajuChart;
  try {
    chart = await computeChart(input);
  } catch (e) {
    return (
      <div className="px-4 pt-3">
        <ErrorCard message={e instanceof Error ? e.message : "사주를 못 뽑았어요."} />
      </div>
    );
  }
  const hasKey = !!process.env.OPENAI_API_KEY;
  const unlockedYears = await getUnlockedYearlyYears(chart.yearlyList.map((item) => item.year), input);

  return (
    <main className="flex flex-col gap-3 px-4 pt-3">
      <ContextRow input={input} qs={qs} />
      {hasKey ? (
        <Suspense fallback={<OverviewSkeleton />}>
          <OverviewBlock
            input={input}
            chart={chart}
            isPaid={isPaid}
            qs={qs}
            unlockedYears={unlockedYears}
          />
        </Suspense>
      ) : (
        <NoKeyCard />
      )}
      <CrossSell />
      <p className="text-[11px] text-sb-ink-3 leading-relaxed px-1 mt-2">
        ※ 한 해는 천간·지지가 본인 일간과 만나서 만드는 1년 단위의 결. 올해 12개월·6대 운세·시크릿 솔루션 전체는 990원으로 열어볼 수 있어요.
      </p>
    </main>
  );
}

async function OverviewBlock({
  input,
  chart,
  isPaid,
  qs,
  unlockedYears,
}: {
  input: SajuInput;
  chart: SajuChart;
  isPaid: boolean;
  qs: string;
  unlockedYears: number[];
}) {
  let overview: YearlyOverview;
  try {
    overview = await generateYearlyOverview(input, chart);
  } catch (e) {
    return <ErrorCard message={e instanceof Error ? e.message : "해설을 못 가져왔어요."} />;
  }

  return (
    <>
      {overview.pastYears.length > 0 && <PastYearsCollapsible items={overview.pastYears} qs={qs} />}
      <CurrentYearHero current={overview.currentYear} qs={qs} isPaid={isPaid} input={input} />
      {overview.futureYears.length > 0 && (
        <FutureYearsList items={overview.futureYears} unlockedYears={unlockedYears} qs={qs} />
      )}
    </>
  );
}

// ============================================================
// Context row
// ============================================================

function ContextRow({ input, qs }: { input: SajuInput; qs: string }) {
  return (
    <section className="flex flex-wrap items-center gap-1.5">
      <span className="text-[10.5px] font-extrabold text-sb-ink-3 tracking-wider uppercase mr-1">
        지금 상황
      </span>
      <span
        className="px-2.5 py-1 rounded-full text-[11px] font-extrabold"
        style={{
          background: input.loveStatus ? "var(--sb-cream)" : "transparent",
          color: input.loveStatus ? "var(--sb-olive-dark)" : "var(--sb-ink-3)",
          boxShadow: "inset 0 0 0 1px var(--sb-hairline)",
        }}
      >
        💞 {input.loveStatus ?? "연애 미선택"}
      </span>
      <span
        className="px-2.5 py-1 rounded-full text-[11px] font-extrabold"
        style={{
          background: input.jobStatus ? "var(--sb-cream)" : "transparent",
          color: input.jobStatus ? "var(--sb-olive-dark)" : "var(--sb-ink-3)",
          boxShadow: "inset 0 0 0 1px var(--sb-hairline)",
        }}
      >
        💼 {input.jobStatus ?? "직업 미선택"}
      </span>
      <Link
        href={`/saju?next=yearly${qs ? `&${qs}` : ""}`}
        className="ml-auto text-[10.5px] font-bold text-sb-ink-3 underline underline-offset-2"
      >
        수정
      </Link>
    </section>
  );
}

// ============================================================
// Past years collapsible
// ============================================================

function PastYearsCollapsible({ items, qs }: { items: YearListItem[]; qs: string }) {
  return (
    <details
      className="bg-sb-paper rounded-sb-lg overflow-hidden"
      style={{ boxShadow: "var(--shadow-sb-card), inset 0 0 0 1px rgba(91,74,54,0.06)" }}
    >
      <summary className="flex items-center justify-between px-4 py-3 cursor-pointer">
        <span className="text-[12px] font-extrabold text-sb-ink tracking-tight">
          ⏮ 지난 {items.length}년 회고
        </span>
        <svg className="sb-chevron" width="14" height="14" viewBox="0 0 14 14" fill="none">
          <path
            d="M3 5L7 9L11 5"
            stroke="var(--sb-ink-3)"
            strokeWidth="1.8"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      </summary>
      <div className="sb-accordion-body px-3 pb-3 flex flex-col gap-2 pt-1">
        {items.map((it) => (
          <Link
            key={it.year}
            href={detailHref(qs, it.year)}
            className="rounded-sb-md px-3 py-2 flex items-center gap-2 active:scale-[0.99] transition-transform"
            style={{
              background: "rgba(255,248,232,0.5)",
              boxShadow: "inset 0 0 0 1px rgba(91,74,54,0.06)",
            }}
          >
            <span className="text-[12px] font-extrabold text-sb-ink tabular-nums w-11 shrink-0">
              {it.year}
            </span>
            <span className="text-[10px] font-bold text-sb-ink-3 w-10 shrink-0">
              {it.ageKorean}세
            </span>
            <span className="text-[12px] text-sb-ink-2 flex-1">{it.subtitle}</span>
            <svg width="10" height="10" viewBox="0 0 10 10" fill="none" aria-hidden>
              <path
                d="M3.5 2L6.5 5L3.5 8"
                stroke="var(--sb-ink-3)"
                strokeWidth="1.8"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          </Link>
        ))}
      </div>
    </details>
  );
}

// ============================================================
// Current year HERO with primary CTA
// ============================================================

function CurrentYearHero({
  current,
  qs,
  isPaid,
  input,
}: {
  current: YearlyOverview["currentYear"];
  qs: string;
  isPaid: boolean;
  input: SajuInput;
}) {
  const unlockHref = isPaid
    ? detailHref(qs, current.year)
    : paidDetailHref(qs, current.year, input);
  const sampleHref = detailHref(qs, current.year);
  return (
    <section
      className="relative rounded-sb-xl overflow-hidden"
      style={{
        background: "linear-gradient(170deg, #FCE0DA 0%, #F5C2B5 100%)",
        boxShadow: "var(--shadow-sb-hero), inset 0 1px 0 rgba(255,255,255,0.5)",
      }}
    >
      <div
        className="absolute -top-10 -right-10 w-40 h-40 rounded-full pointer-events-none"
        style={{
          background: "radial-gradient(circle, rgba(255,240,180,0.55) 0%, transparent 70%)",
        }}
      />
      <div className="relative px-5 pt-4 pb-4 flex flex-col gap-2.5">
        <div className="flex items-center gap-1.5">
          <span className="text-[10.5px] font-extrabold text-sb-terra-dark tracking-wider uppercase">
            ★ {current.year} · 한국나이 {current.ageKorean}세
          </span>
          <span
            className="text-[9px] font-extrabold px-1.5 py-[2px] rounded-full"
            style={{ background: "var(--sb-yuzu)", color: "var(--sb-olive-dark)" }}
          >
            올해
          </span>
        </div>
        <h1 className="text-[20px] font-extrabold text-sb-ink tracking-tight leading-snug">
          {current.headline}
        </h1>
        {current.teaser && (
          <p className="text-[13.5px] text-sb-ink-2 leading-relaxed whitespace-pre-wrap">
            {current.teaser}
          </p>
        )}
        <Link
          id="yearly-primary-paywall-cta"
          href={unlockHref}
          className="rounded-full px-4 py-3 text-[14px] font-extrabold tracking-tight text-center mt-1"
          style={{
            background:
              "linear-gradient(135deg, var(--sb-yuzu-light), var(--sb-yuzu) 60%, var(--sb-yuzu-dark))",
            color: "var(--sb-olive-dark)",
            boxShadow: "0 4px 14px rgba(216,154,42,0.5)",
          }}
        >
          {isPaid ? `${current.year}년 자세히 보기` : `990원으로 ${current.year}년 전체 열기`}
        </Link>
        {!isPaid && (
          <>
            <ul className="flex flex-col gap-1 mt-0.5">
              {[
                "12개월 상세 해설",
                "6대 운세 (연애·인간관계·금전·직업·건강·성장)",
                "시크릿 솔루션 4종",
              ].map((line) => (
                <li
                  key={line}
                  className="flex items-center gap-1.5 text-[12px] font-bold text-sb-ink-2"
                >
                  <span style={{ color: "var(--sb-terra)" }}>✓</span>
                  {line}
                </li>
              ))}
            </ul>
            <Link
              href={sampleHref}
              className="text-[11.5px] font-bold text-sb-terra-dark underline underline-offset-2 mt-1"
            >
              샘플 1~3월 + 시크릿 1번만 무료로 먼저 보기 →
            </Link>
          </>
        )}
      </div>
    </section>
  );
}

// ============================================================
// Future years locked list
// ============================================================

function FutureYearsList({
  items,
  unlockedYears,
  qs,
}: {
  items: YearListItem[];
  unlockedYears: number[];
  qs: string;
}) {
  const unlocked = new Set(unlockedYears);
  return (
    <section className="flex flex-col gap-2">
      <div className="text-[10.5px] font-extrabold text-sb-ink-3 tracking-wider uppercase px-1">
        🔮 앞으로 {items.length}년 — 눌러서 미리보기
      </div>
      {items.map((it) => {
        const isUnlocked = unlocked.has(it.year);
        return (
          <Link
            key={it.year}
            href={detailHref(qs, it.year)}
            className="bg-sb-paper rounded-sb-lg px-4 py-3 active:scale-[0.99] transition-transform"
            style={{ boxShadow: "var(--shadow-sb-card), inset 0 0 0 1px rgba(91,74,54,0.06)" }}
          >
            <div className="flex items-center gap-2.5">
              <div className="flex flex-col items-center w-12 shrink-0">
                <span className="text-[12px] font-extrabold text-sb-ink tabular-nums leading-none">
                  {it.year}
                </span>
                <span className="text-[9px] font-bold text-sb-ink-3 mt-0.5">
                  {it.ageKorean}세
                </span>
              </div>
              <p className="text-[12.5px] font-bold text-sb-ink-2 flex-1">{it.subtitle}</p>
              <span className="text-[11px] font-extrabold shrink-0 text-sb-terra-dark">
                {isUnlocked ? "🔓" : "🔒"}
              </span>
              <svg width="11" height="11" viewBox="0 0 10 10" fill="none" aria-hidden className="shrink-0 ml-0.5">
                <path
                  d="M3.5 2L6.5 5L3.5 8"
                  stroke="var(--sb-ink-3)"
                  strokeWidth="1.8"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
            </div>
          </Link>
        );
      })}
    </section>
  );
}

// ============================================================
// Cross-sell
// ============================================================

function CrossSell() {
  const items = [
    { href: "/daewoon", title: "대운 해설", subtitle: "큰 흐름 읽기", image: "/images/banners/daewoon-blue.png", fallback: "linear-gradient(160deg, #D9E9F7 0%, #7EA8CF 100%)" },
    { href: "/saju", title: "사주바라", subtitle: "내 안의 에너지", image: "/images/banners/saju.png", fallback: "linear-gradient(160deg, #FCE7E3 0%, #F5C8C0 100%)" },
    { href: "/color", title: "컬러바라", subtitle: "생일 컬러", image: "/images/banners/color.png", fallback: "radial-gradient(circle at 28% 30%, rgba(143,191,122,0.78) 0 18%, transparent 19%), radial-gradient(circle at 68% 34%, rgba(229,200,77,0.74) 0 17%, transparent 18%), linear-gradient(160deg, #EDEAC8 0%, #C9DFE5 100%)" },
  ];
  return (
    <section className="mt-2">
      <div className="text-[10.5px] font-extrabold text-sb-ink-3 tracking-wider uppercase mb-2 px-1">
        🪷 다른 결도 봐보기
      </div>
      <div className="flex gap-2 overflow-x-auto -mx-4 px-4 pb-1" style={{ scrollbarWidth: "none" }}>
        {items.map((it) => (
          <Link
            key={it.href}
            href={it.href}
            className="shrink-0 w-[148px] rounded-sb-lg overflow-hidden bg-sb-paper active:scale-[0.98] transition-transform"
            style={{ boxShadow: "var(--shadow-sb-card), inset 0 0 0 1px rgba(91,74,54,0.06)" }}
          >
            <div
              className="w-full aspect-[5/4]"
              style={{
                backgroundImage: it.image ? `url(${it.image}), ${it.fallback}` : it.fallback,
                backgroundSize: it.image ? "cover, cover" : "cover",
                backgroundPosition: "center, center",
                backgroundRepeat: "no-repeat, no-repeat",
              }}
              aria-hidden
            />
            <div className="px-2.5 pt-2 pb-2.5">
              <div className="text-[9.5px] font-extrabold text-sb-ink-3 tracking-tight">
                {it.subtitle}
              </div>
              <div className="text-[13px] font-extrabold text-sb-ink tracking-tight">
                {it.title}
              </div>
            </div>
          </Link>
        ))}
      </div>
    </section>
  );
}

// ============================================================
// Sticky paywall bar
// ============================================================

function StickyPaywall({
  qs,
  year,
  input,
}: {
  qs: string;
  year: number;
  input: SajuInput;
}) {
  return (
    <StickyPaywallLink
      href={paidDetailHref(qs, year, input)}
      label={`🔒 990원으로 ${year}년 전체 열기`}
      observeTargetId="yearly-primary-paywall-cta"
    />
  );
}

// ============================================================
// Skeleton / error / empty / header
// ============================================================

function OverviewSkeleton() {
  return (
    <>
      <div
        className="rounded-sb-xl px-5 py-6 sb-skeleton-shimmer"
        style={{
          background: "linear-gradient(170deg, #FCE0DA 0%, #F5C2B5 100%)",
          boxShadow: "var(--shadow-sb-hero)",
        }}
      >
        <div className="h-3 rounded-full bg-white/60 w-[40%] mb-3" />
        <div className="h-5 rounded-full bg-white/60 w-[80%] mb-2" />
        <div className="h-3 rounded-full bg-white/60 w-[90%] mb-1" />
        <div className="h-3 rounded-full bg-white/60 w-[70%]" />
      </div>
      <p className="text-[11px] text-sb-ink-3 text-center">올해 한 줄 카피 짓는 중이에요…</p>
    </>
  );
}

function NoKeyCard() {
  return (
    <div
      className="bg-sb-paper rounded-sb-lg px-5 py-5"
      style={{ boxShadow: "var(--shadow-sb-card), inset 0 0 0 1px rgba(91,74,54,0.06)" }}
    >
      <p className="text-[13px] text-sb-ink-2 leading-relaxed">
        AI 해설은 OPENAI_API_KEY 설정 후 표시돼요.
      </p>
    </div>
  );
}

function ErrorCard({ message }: { message: string }) {
  return (
    <div
      className="bg-sb-paper rounded-sb-lg px-5 py-5"
      style={{ boxShadow: "var(--shadow-sb-card), inset 0 0 0 1px rgba(91,74,54,0.06)" }}
    >
      <h2 className="text-[15px] font-extrabold text-sb-ink mb-1.5">해설을 못 가져왔어요</h2>
      <p className="text-[13px] text-sb-ink-2 leading-relaxed">{message}</p>
    </div>
  );
}

function Header() {
  return (
    <header
      className="flex items-center justify-between px-5 pt-3 pb-2 shrink-0"
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
        <svg width="10" height="10" viewBox="0 0 10 10" fill="none" aria-hidden>
          <path
            d="M6.5 2L3.5 5L6.5 8"
            stroke="var(--sb-ink-2)"
            strokeWidth="1.8"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
        뒤로
      </Link>
      <span className="text-[19px] font-extrabold text-sb-olive-dark tracking-tight">
        📅 연도별 운세
      </span>
      <div className="w-9" />
    </header>
  );
}

function EmptyState() {
  return (
    <div className="px-4 pt-3">
      <div
        className="rounded-sb-xl px-6 py-10 text-center mt-3"
        style={{
          background: "linear-gradient(170deg, #FCE0DA 0%, #F5C2B5 100%)",
          boxShadow: "var(--shadow-sb-hero), inset 0 1px 0 rgba(255,255,255,0.5)",
        }}
      >
        <div className="text-[48px] mb-2">📅</div>
        <h1 className="text-[18px] font-extrabold text-sb-ink mb-1.5 tracking-tight">
          연도별 운세 정보를 입력해 주세요
        </h1>
        <p className="text-[13px] text-sb-ink-2 leading-relaxed mb-5">
          생년월일·시간을 등록하면
          <br />
          올해 + 미래 6년 흐름을 풀어드려요.
        </p>
        <Link
          href="/saju?next=yearly"
          className="inline-flex items-center gap-1.5 rounded-full bg-sb-olive text-white text-[13px] font-bold px-4 py-2.5"
          style={{ boxShadow: "0 2px 6px rgba(92,110,62,0.3)" }}
        >
          연도별 정보 입력하기
        </Link>
      </div>
    </div>
  );
}

function parseInput(sp: Awaited<SearchParams>): SajuInput | null {
  const { name, birthDate, birthTime, gender, calendar, loveStatus, jobStatus } = sp;
  if (!name || !birthDate) return null;
  const g: Gender = gender === "남" ? "남" : "여";
  const c: CalendarType = calendar === "음력" ? "음력" : "양력";
  const love =
    loveStatus && (LOVE_STATUSES as readonly string[]).includes(loveStatus)
      ? (loveStatus as LoveStatus)
      : undefined;
  const job =
    jobStatus && (JOB_STATUSES as readonly string[]).includes(jobStatus)
      ? (jobStatus as JobStatus)
      : undefined;
  return {
    name,
    birthDate,
    birthTime: birthTime ?? "모름",
    gender: g,
    calendar: c,
    loveStatus: love,
    jobStatus: job,
  };
}

function inputToQs(sp: Awaited<SearchParams>): string {
  const obj: Record<string, string> = {};
  if (sp.name) obj.name = sp.name;
  if (sp.birthDate) obj.birthDate = sp.birthDate;
  if (sp.birthTime) obj.birthTime = sp.birthTime;
  if (sp.gender) obj.gender = sp.gender;
  if (sp.calendar) obj.calendar = sp.calendar;
  if (sp.loveStatus) obj.loveStatus = sp.loveStatus;
  if (sp.jobStatus) obj.jobStatus = sp.jobStatus;
  return new URLSearchParams(obj).toString();
}

function detailHref(qs: string, year: number): string {
  return qs ? `/yearly/${year}?${qs}` : `/yearly/${year}`;
}

async function getUnlockedYearlyYears(years: number[], input: SajuInput): Promise<number[]> {
  const personKey = sajuPersonKey(input);
  const checks = await Promise.all(
    years.map(async (year) => {
      const unlocked = await canViewPaidContent(false, {
        product: "yearly",
        year,
        personKey,
      });
      return unlocked ? year : null;
    }),
  );
  return checks.filter((year): year is number => typeof year === "number");
}

function paidDetailHref(qs: string, year: number, input: SajuInput): string {
  const p = new URLSearchParams(qs);
  p.set("paid", "1");
  return checkoutHref({
    amount: 990,
    product: `yearly:${sajuPersonKey(input)}:${year}`,
    returnTo: `/yearly/${year}?${p.toString()}`,
    title: `${year}년 전체 해설`,
  });
}
