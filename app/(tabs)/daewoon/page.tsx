import Link from "next/link";
import { Suspense } from "react";
import ContentDisclaimer from "@/app/components/ContentDisclaimer";
import DaewoonPeriodSwitchLink from "@/app/components/DaewoonPeriodSwitchLink";
import ReportAccessPanel from "@/app/components/ReportAccessPanel";
import ReportGenerationLoading from "@/app/components/ReportGenerationLoading";
import ReportUtilityActions from "@/app/components/ReportUtilityActions";
import ScrollToAnchor from "@/app/components/ScrollToAnchor";
import StickyPaywallLink from "@/app/components/StickyPaywallLink";
import { buildReportAccessItems } from "@/lib/auth/report-access";
import { canViewPaidContent } from "@/lib/auth/paid";
import { checkoutHref } from "@/lib/payments/checkout";
import { computeChart, type DaewoonItem, type SajuChart } from "@/lib/saju/chart";
import {
  DAEWOON_CHAPTER_META,
  generateDaewoonReport,
  twelveStage,
  type DaewoonReport,
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
  index?: string;
}>;

export default async function DaewoonPage({
  searchParams,
}: {
  searchParams: SearchParams;
}) {
  const sp = await searchParams;
  const input = parseInput(sp);
  const requestedPaid = sp.paid === "1";
  const requestedIndex =
    sp.index !== undefined && /^\d+$/.test(sp.index) ? parseInt(sp.index, 10) : undefined;
  const qs = inputToQs(sp);

  return (
    <>
      <Header />
      <div className="flex-1 overflow-y-auto pb-36">
        {!input ? (
          <EmptyState />
        ) : (
          <DaewoonBody
            input={input}
            requestedPaid={requestedPaid}
            qs={qs}
            requestedIndex={requestedIndex}
          />
        )}
      </div>
    </>
  );
}

async function DaewoonBody({
  input,
  requestedPaid,
  qs,
  requestedIndex,
}: {
  input: SajuInput;
  requestedPaid: boolean;
  qs: string;
  requestedIndex: number | undefined;
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
  const currentIdx = Math.max(0, chart.daewoonList.findIndex((d) => d.isCurrent));
  const focusListIdx =
    requestedIndex !== undefined
      ? chart.daewoonList.findIndex((d) => d.index === requestedIndex)
      : -1;
  const safeFocusIdx = focusListIdx >= 0 ? focusListIdx : currentIdx;
  const focused = chart.daewoonList[safeFocusIdx];
  const isFocusingCurrent = safeFocusIdx === currentIdx;
  const isPaid = await canViewPaidContent(requestedPaid, {
    product: "daewoon",
    period: isFocusingCurrent ? "current" : focused.index,
    personKey: sajuPersonKey(input),
  });
  const unlockedPeriodIndexes = await getUnlockedDaewoonIndexes(chart.daewoonList, input);
  const accessItems = isPaid ? await buildReportAccessItems(input) : [];

  return (
    <>
      <ScrollToAnchor id="daewoon-report" signal={focused.index} />
      <main className="flex flex-col gap-3 px-4 pt-3">
        <ContextRow input={input} qs={qs} />
        <NatalManseryeok chart={chart} />
        <DaewoonCarousel
          periods={chart.daewoonList}
          dayMasterHanja={chart.dayMaster.hanja}
          qs={qs}
          focusedIndex={focused.index}
          unlockedPeriodIndexes={unlockedPeriodIndexes}
        />
        <SewunTimeline chart={chart} focused={focused} isCurrentFocus={isFocusingCurrent} />
        <ReportUtilityActions
          title={`${input.name}님의 ${focused.startAge}~${focused.endAge}세 대운 해설`}
          description="바라사주에서 본 대운 해설이에요."
        />
        <ContentDisclaimer compact />
        <div id="daewoon-report" style={{ scrollMarginTop: 12 }} />

        {hasKey ? (
          <Suspense
            fallback={
              <ReportGenerationLoading
                visual="daewoon"
                eyebrow={isPaid ? "PAID DAEWOON GENERATING" : "FREE PREVIEW GENERATING"}
                title={`${input.name}님의 ${focused.startAge}~${focused.endAge}세 대운을 해석하는 중이에요`}
                description="10년 대운과 연도별 세운을 맞춰보고, 5대 핵심 해설과 시크릿 솔루션을 정리하고 있어요."
                steps={[
                  "대운 천간·지지 관계 확인",
                  "10년 세운 흐름 정리",
                  isPaid ? "구매한 상세 본문 생성" : "무료 핵심 문장 준비",
                ]}
              />
            }
          >
            <ReportBlock
              input={input}
              chart={chart}
              isPaid={isPaid}
              qs={qs}
              focusIndex={focused.index}
              unlockedPeriodIndexes={unlockedPeriodIndexes}
            />
          </Suspense>
        ) : (
          <NoKeyCard />
        )}
        {isPaid && <ReportAccessPanel items={accessItems} />}

        <p className="text-[11px] text-sb-ink-3 leading-relaxed px-1 mt-2">
          ※ 대운은 10년 단위로 흐르는 큰 운의 결. 본 해설은 일간(본인)과 그 기간 천간·지지·12운성의 관계로 풀어요.
        </p>
      </main>
      {!isPaid && <StickyPaywall qs={qs} period={focused} input={input} />}
    </>
  );
}

async function ReportBlock({
  input,
  chart,
  isPaid,
  qs,
  focusIndex,
  unlockedPeriodIndexes,
}: {
  input: SajuInput;
  chart: SajuChart;
  isPaid: boolean;
  qs: string;
  focusIndex: number;
  unlockedPeriodIndexes: number[];
}) {
  let report: DaewoonReport;
  try {
    report = await generateDaewoonReport(input, chart, focusIndex, !isPaid);
  } catch (e) {
    return <ErrorCard message={e instanceof Error ? e.message : "해설을 못 가져왔어요."} />;
  }

  const current = chart.daewoonList[report.currentIndex];

  return (
    <>
      <HeroBlock
        period={current}
        hero={report.hero}
      />
      {isPaid && <OverviewBlock overview={report.overview} />}
      {!isPaid && <PaywallValueProp period={current} qs={qs} input={input} />}
      <ChapterStack chapters={report.chapters} isPaid={isPaid} />
      <SewunCardList cards={report.sewunCards} isPaid={isPaid} chart={chart} />
      <SecretCard secret={report.secret} isPaid={isPaid} />
      {isPaid && <FinalGuideCard guide={report.finalGuide} />}
      {report.pastSummaries.length > 0 && (
        <PastSummaries
          summaries={report.pastSummaries}
          periods={chart.daewoonList}
          qs={qs}
          unlockedPeriodIndexes={unlockedPeriodIndexes}
        />
      )}
      {report.futureTeasers.length > 0 && (
        <FutureList
          teasers={report.futureTeasers}
          periods={chart.daewoonList}
          qs={qs}
          unlockedPeriodIndexes={unlockedPeriodIndexes}
        />
      )}
      <CrossSell />
    </>
  );
}

function CrossSell() {
  const items = [
    { href: "/saju", title: "바라사주", subtitle: "내 안의 에너지", image: "/images/banners/saju.png", fallback: "linear-gradient(160deg, #FCE7E3 0%, #F5C8C0 100%)" },
    { href: "/yearly", title: "연도별 운세", subtitle: "한 해의 흐름", image: "/images/banners/yearly.png", fallback: "linear-gradient(160deg, #F5E5B6 0%, #E8CB7B 100%)" },
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
// Context (love/job) row
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
        href={`/saju?next=daewoon${qs ? `&${qs}` : ""}`}
        className="ml-auto text-[10.5px] font-bold text-sb-ink-3 underline underline-offset-2"
      >
        수정
      </Link>
    </section>
  );
}

// ============================================================
// Natal manseryeok table (collapsible)
// ============================================================

const ELEMENT_COLORS: Record<string, { bg: string; ink: string }> = {
  wood: { bg: "#D7E5BD", ink: "#3F4D2A" },
  fire: { bg: "#F7CDB7", ink: "#8B3A1F" },
  earth: { bg: "#EBD8B0", ink: "#7A5A24" },
  metal: { bg: "#E1E4E7", ink: "#465358" },
  water: { bg: "#C7D8E1", ink: "#2E4B5A" },
};

function NatalManseryeok({ chart }: { chart: SajuChart }) {
  return (
    <details
      className="bg-sb-paper rounded-sb-lg overflow-hidden"
      style={{ boxShadow: "var(--shadow-sb-card), inset 0 0 0 1px rgba(91,74,54,0.06)" }}
    >
      <summary className="flex items-center justify-between px-4 py-3 cursor-pointer">
        <div className="flex items-center gap-2">
          <span className="text-[12px] font-extrabold text-sb-ink tracking-tight">
            🪷 내 만세력 4기둥
          </span>
          <span className="text-[10px] text-sb-ink-3">
            일간 {chart.dayMaster.korean}
          </span>
        </div>
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
      <div className="sb-accordion-body px-4 pb-4">
        <div className="grid grid-cols-4 gap-1.5 pt-1">
          {chart.pillars.map((p) => {
            const sc = ELEMENT_COLORS[p.stem.element];
            const bc = ELEMENT_COLORS[p.branch.element];
            return (
              <div
                key={p.position}
                className="rounded-sb-md p-1.5 flex flex-col items-center gap-1"
                style={{
                  background: p.isDayMaster ? "var(--sb-cream)" : "rgba(255,248,232,0.5)",
                  boxShadow: p.isDayMaster
                    ? "inset 0 0 0 1.5px var(--sb-yuzu-dark)"
                    : "inset 0 0 0 1px rgba(91,74,54,0.07)",
                }}
              >
                <span className="text-[9px] font-extrabold text-sb-ink-3">{p.position}주</span>
                <div
                  className="w-full aspect-square rounded-md flex flex-col items-center justify-center"
                  style={{ background: sc.bg, color: sc.ink }}
                >
                  <span className="text-[18px] font-extrabold leading-none">{p.stem.hanja}</span>
                  <span className="text-[8px] font-bold mt-0.5">{p.stemTenGod}</span>
                </div>
                <div
                  className="w-full aspect-square rounded-md flex flex-col items-center justify-center"
                  style={{ background: bc.bg, color: bc.ink }}
                >
                  <span className="text-[18px] font-extrabold leading-none">{p.branch.hanja}</span>
                  <span className="text-[8px] font-bold mt-0.5">{p.branchTenGod}</span>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </details>
  );
}

// ============================================================
// Daewoon carousel (horizontal scroll all periods)
// ============================================================

function DaewoonCarousel({
  periods,
  dayMasterHanja,
  qs,
  focusedIndex,
  unlockedPeriodIndexes,
}: {
  periods: DaewoonItem[];
  dayMasterHanja: string;
  qs: string;
  focusedIndex: number;
  unlockedPeriodIndexes: number[];
}) {
  const unlocked = new Set(unlockedPeriodIndexes);
  return (
    <section>
      <div className="text-[10.5px] font-extrabold text-sb-olive-dark tracking-wider uppercase mb-2 px-1">
        🌊 전체 대운 흐름
      </div>
      <div
        className="flex gap-2 overflow-x-auto pb-1 -mx-4 px-4"
        style={{ scrollSnapType: "x mandatory", scrollbarWidth: "none" }}
      >
        {periods.map((d) => {
          const sc = ELEMENT_COLORS[d.stem.element];
          const bc = ELEMENT_COLORS[d.branch.element];
          const stage = twelveStage(dayMasterHanja, d.branch.hanja);
          const isFocused = d.index === focusedIndex;
          const isUnlocked = unlocked.has(d.index);
          const status = d.isCurrent ? "현재" : "";
          const cardClassName =
            "shrink-0 w-[88px] rounded-sb-md p-2 flex flex-col items-center gap-1.5 text-center border-0";
          const cardStyle = {
            background: isFocused
              ? "var(--sb-cream)"
              : d.isCurrent
                ? "rgba(255,248,232,0.6)"
                : "var(--sb-paper)",
            boxShadow: isFocused
              ? "var(--shadow-sb-card), inset 0 0 0 2px var(--sb-olive-dark)"
              : d.isCurrent
                ? "var(--shadow-sb-card), inset 0 0 0 1.5px var(--sb-yuzu-dark)"
                : "inset 0 0 0 1px rgba(91,74,54,0.07)",
            scrollSnapAlign: "start",
          } as const;
          const content = (
            <>
              <span className="text-[10px] font-extrabold text-sb-ink-3">
                {d.startAge}~{d.endAge}
              </span>
              <div className="flex gap-0.5">
                <div
                  className="w-7 h-7 rounded flex items-center justify-center text-[14px] font-extrabold"
                  style={{ background: sc.bg, color: sc.ink }}
                >
                  {d.stem.hanja}
                </div>
                <div
                  className="w-7 h-7 rounded flex items-center justify-center text-[14px] font-extrabold"
                  style={{ background: bc.bg, color: bc.ink }}
                >
                  {d.branch.hanja}
                </div>
              </div>
              {stage && (
                <span
                  className="text-[9px] font-extrabold px-1.5 py-[1px] rounded-full"
                  style={{ background: "rgba(91,74,54,0.06)", color: "var(--sb-ink-2)" }}
                >
                  {stage}
                </span>
              )}
              {isFocused ? (
                <span
                  className="text-[8.5px] font-extrabold px-1.5 py-[1px] rounded-full"
                  style={{ background: "var(--sb-olive-dark)", color: "white" }}
                >
                  보는 중
                </span>
              ) : status ? (
                <span
                  className="text-[8.5px] font-extrabold px-1.5 py-[1px] rounded-full"
                  style={{ background: "var(--sb-yuzu)", color: "var(--sb-olive-dark)" }}
                >
                  {status}
                </span>
              ) : null}
            </>
          );
          if (isFocused) {
            return (
              <div key={d.index} className={cardClassName} style={cardStyle}>
                {content}
              </div>
            );
          }
          return (
            <DaewoonPeriodSwitchLink
              key={d.index}
              href={focusHref(qs, d.index)}
              periodLabel={`${d.startAge}~${d.endAge}세`}
              alreadyUnlocked={isUnlocked}
              className={cardClassName}
              style={cardStyle}
            >
              {content}
            </DaewoonPeriodSwitchLink>
          );
        })}
      </div>
    </section>
  );
}

// ============================================================
// Sewun timeline (current daewoon 10 years)
// ============================================================

function SewunTimeline({
  chart,
  focused,
  isCurrentFocus,
}: {
  chart: SajuChart;
  focused: DaewoonItem;
  isCurrentFocus: boolean;
}) {
  const thisYear = currentKstYear();
  const birthYear = thisYear - chart.age;
  const years = Array.from({ length: focused.endAge - focused.startAge + 1 }, (_, i) => {
    const age = focused.startAge + i;
    return { year: birthYear + age, age, ageKorean: age + 1 };
  });

  return (
    <section
      className="bg-sb-paper rounded-sb-lg px-4 py-3.5"
      style={{ boxShadow: "var(--shadow-sb-card), inset 0 0 0 1px rgba(91,74,54,0.06)" }}
    >
      <div className="text-[10.5px] font-extrabold text-sb-terra-dark tracking-wider uppercase mb-2">
        📅 {focused.startAge}~{focused.endAge}세 10년 — 세운 타임라인
      </div>
      <ol className="flex flex-col">
        {years.map((y, i) => {
          const isThisYear = isCurrentFocus && y.year === thisYear;
          const isLast = i === years.length - 1;
          return (
            <li key={y.year} className="flex items-stretch gap-3 min-h-[28px]">
              <div className="flex flex-col items-center w-3 shrink-0">
                <span
                  className="block rounded-full"
                  style={{
                    width: isThisYear ? 10 : 6,
                    height: isThisYear ? 10 : 6,
                    background: isThisYear ? "var(--sb-yuzu-dark)" : "var(--sb-cream-dark)",
                    boxShadow: isThisYear ? "0 0 0 3px rgba(216,154,42,0.2)" : "none",
                    marginTop: 6,
                  }}
                />
                {!isLast && (
                  <span
                    className="flex-1 w-[2px] my-0.5"
                    style={{ background: "var(--sb-hairline)" }}
                  />
                )}
              </div>
              <div className="flex-1 flex items-center gap-2 pb-2">
                <span className="text-[12px] font-extrabold text-sb-ink tabular-nums w-12">
                  {y.year}
                </span>
                <span className="text-[10.5px] font-bold text-sb-ink-3 w-12">
                  {y.ageKorean}세
                </span>
                <span className="text-[10.5px] text-sb-ink-2">
                  대운 {focused.stem.korean}{focused.branch.korean}
                </span>
                {isThisYear && (
                  <span
                    className="ml-auto text-[8.5px] font-extrabold px-1.5 py-[1px] rounded-full"
                    style={{ background: "var(--sb-yuzu)", color: "var(--sb-olive-dark)" }}
                  >
                    올해
                  </span>
                )}
                {isLast && !isThisYear && (
                  <span
                    className="ml-auto text-[8.5px] font-extrabold px-1.5 py-[1px] rounded-full"
                    style={{ background: "rgba(140,86,60,0.12)", color: "var(--sb-terra-dark)" }}
                  >
                    전환
                  </span>
                )}
              </div>
            </li>
          );
        })}
      </ol>
    </section>
  );
}

// ============================================================
// Hero
// ============================================================

function HeroBlock({
  period,
  hero,
}: {
  period: DaewoonItem;
  hero: DaewoonReport["hero"];
}) {
  return (
    <section
      className="relative rounded-sb-xl px-5 pt-5 pb-5 overflow-hidden"
      style={{
        background: "linear-gradient(170deg, #DDE7C8 0%, #C7DFA6 100%)",
        boxShadow: "var(--shadow-sb-hero), inset 0 1px 0 rgba(255,255,255,0.5)",
      }}
    >
      <div className="text-[10.5px] font-extrabold text-sb-olive-dark tracking-wider uppercase mb-1">
        🌊 {period.startAge}~{period.endAge}세 대운의 큰 흐름
      </div>
      <h1 className="text-[20px] font-extrabold text-sb-ink tracking-tight leading-snug mb-2">
        {hero.headline}
      </h1>
      <p className="text-[13px] text-sb-ink-2 leading-relaxed whitespace-pre-wrap">
        {hero.body}
      </p>
    </section>
  );
}

function OverviewBlock({ overview }: { overview: DaewoonReport["overview"] }) {
  if (!overview.body) return null;
  return (
    <section
      className="rounded-sb-xl px-5 py-5 bg-sb-paper"
      style={{
        boxShadow: "var(--shadow-sb-card), inset 0 0 0 1px rgba(91,74,54,0.06)",
      }}
    >
      <div className="text-[10.5px] font-extrabold text-sb-terra-dark tracking-wider uppercase mb-1.5">
        📖 10년 총론
      </div>
      <h2 className="text-[18px] font-extrabold text-sb-ink tracking-tight leading-snug mb-2.5">
        {overview.title}
      </h2>
      <p className="text-[13.5px] text-sb-ink-2 leading-[1.9] whitespace-pre-wrap">
        {overview.body}
      </p>
    </section>
  );
}

// ============================================================
// Paywall value-prop (primary CTA)
// ============================================================

function PaywallValueProp({
  period,
  qs,
  input,
}: {
  period: DaewoonItem;
  qs: string;
  input: SajuInput;
}) {
  const unlockHref = paidHref(qs, period, input);
  return (
    <section
      className="rounded-sb-lg overflow-hidden relative"
      style={{
        background: "linear-gradient(135deg, var(--sb-olive-dark) 0%, var(--sb-olive) 100%)",
        boxShadow: "var(--shadow-sb-pop)",
      }}
    >
      <div
        className="absolute -top-8 -right-8 w-32 h-32 rounded-full pointer-events-none"
        style={{
          background: "radial-gradient(circle, rgba(255,201,93,0.4) 0%, transparent 70%)",
        }}
      />
      <div className="relative px-5 py-4 flex flex-col gap-2.5">
        <div className="text-[10.5px] font-extrabold tracking-wider uppercase" style={{ color: "var(--sb-yuzu-light)" }}>
          🔒 {period.startAge}~{period.endAge}세 대운 전체 해설
        </div>
        <Link
          id="daewoon-primary-paywall-cta"
          href={unlockHref}
          className="rounded-full px-4 py-3 text-[14px] font-extrabold tracking-tight text-center"
          style={{
            background: "linear-gradient(135deg, var(--sb-yuzu-light), var(--sb-yuzu) 60%, var(--sb-yuzu-dark))",
            color: "var(--sb-olive-dark)",
            boxShadow: "0 4px 14px rgba(216,154,42,0.5)",
          }}
        >
          990원으로 {period.startAge}~{period.endAge}세 대운 확인하기
        </Link>
        <ul className="flex flex-col gap-1 mt-1">
          {[
            "이 10년의 5대 핵심 해설",
            "10년 세운 연도별 상세 해설",
            "시크릿 솔루션",
          ].map((line) => (
            <li
              key={line}
              className="flex items-center gap-1.5 text-[12.5px] font-bold text-white"
            >
              <span style={{ color: "var(--sb-yuzu)" }}>✓</span>
              {line}
            </li>
          ))}
        </ul>
        <p className="text-[10.5px] text-white/70 mt-1">
          * 한 번 결제로 평생 다시 보기 · 지금은 핵심만 먼저 보여드려요
        </p>
      </div>
    </section>
  );
}

// ============================================================
// 5 chapter cards (lock policy: subtitle + teaser free, body locked)
// ============================================================

function ChapterStack({
  chapters,
  isPaid,
}: {
  chapters: DaewoonReport["chapters"];
  isPaid: boolean;
}) {
  return (
    <section className="flex flex-col gap-2.5">
      <div className="text-[10.5px] font-extrabold text-sb-olive-dark tracking-wider uppercase px-1">
        🗂 이 10년의 5대 핵심 해설
      </div>
      {chapters.map((ch) => (
        <ChapterCard key={ch.key} chapter={ch} isPaid={isPaid} />
      ))}
    </section>
  );
}

function ChapterCard({
  chapter,
  isPaid,
}: {
  chapter: DaewoonReport["chapters"][number];
  isPaid: boolean;
}) {
  const meta = DAEWOON_CHAPTER_META[chapter.key];
  return (
    <article
      className="bg-sb-paper rounded-sb-lg px-4 py-3.5"
      style={{ boxShadow: "var(--shadow-sb-card), inset 0 0 0 1px rgba(91,74,54,0.06)" }}
    >
      <div className="flex items-center gap-1.5 mb-1">
        <span className="text-[15px]">{meta.emoji}</span>
        <span className="text-[10.5px] font-extrabold text-sb-olive-dark tracking-wider uppercase">
          {meta.title}
        </span>
        {!isPaid && (
          <span className="ml-auto text-[10px] font-extrabold text-sb-terra-dark">🔒</span>
        )}
      </div>
      <h3 className="text-[15px] font-extrabold text-sb-ink leading-snug tracking-tight mb-1.5">
        {chapter.subtitle}
      </h3>
      {chapter.bodyTeaser && (
        <p className="text-[13px] text-sb-ink-2 leading-relaxed mb-2">
          {chapter.bodyTeaser}
        </p>
      )}
      {isPaid && chapter.body && (
        <p className="text-[13.5px] text-sb-ink-2 leading-relaxed whitespace-pre-wrap mt-2">
          {chapter.body}
        </p>
      )}
    </article>
  );
}

// ============================================================
// Sewun cards list (10 years inside current daewoon)
// ============================================================

function SewunCardList({
  cards,
  isPaid,
  chart,
}: {
  cards: DaewoonReport["sewunCards"];
  isPaid: boolean;
  chart: SajuChart;
}) {
  const thisYear = currentKstYear();
  return (
    <section className="flex flex-col gap-2">
      <div className="text-[10.5px] font-extrabold text-sb-terra-dark tracking-wider uppercase px-1">
        🗓 10년 세운 — 연도별 해설
      </div>
      {cards.map((c) => {
        const isCurrent = c.year === thisYear;
        return (
          <article
            key={c.year}
            className="bg-sb-paper rounded-sb-lg px-4 py-3"
            style={{
              boxShadow: isCurrent
                ? "var(--shadow-sb-card), inset 0 0 0 1.5px var(--sb-yuzu-dark)"
                : "var(--shadow-sb-card), inset 0 0 0 1px rgba(91,74,54,0.06)",
              background: isCurrent ? "var(--sb-cream)" : "var(--sb-paper)",
            }}
          >
            <div className="flex items-center gap-2 mb-1">
              <span className="text-[12.5px] font-extrabold text-sb-ink tabular-nums">
                {c.year}
              </span>
              <span className="text-[10px] font-bold text-sb-ink-3">
                한국나이 {c.ageKorean}세
              </span>
              {isCurrent && (
                <span
                  className="text-[8.5px] font-extrabold px-1.5 py-[1px] rounded-full"
                  style={{ background: "var(--sb-yuzu)", color: "var(--sb-olive-dark)" }}
                >
                  올해
                </span>
              )}
              {!isPaid && (
                <span className="ml-auto text-[10px] font-extrabold text-sb-terra-dark">🔒</span>
              )}
            </div>
            <h4 className="text-[13.5px] font-extrabold text-sb-ink leading-snug tracking-tight">
              {c.subtitle}
            </h4>
            {isPaid && c.body && (
              <p className="text-[12.5px] text-sb-ink-2 leading-relaxed mt-1.5 whitespace-pre-wrap">
                {c.body}
              </p>
            )}
          </article>
        );
      })}
      {/* unused but reserved for richer per-year ganzi later */}
      <input type="hidden" data-year={chart.yearlyList[0]?.year ?? ""} />
    </section>
  );
}

// ============================================================
// Secret solution card
// ============================================================

function SecretCard({
  secret,
  isPaid,
}: {
  secret: DaewoonReport["secret"];
  isPaid: boolean;
}) {
  return (
    <section
      className="rounded-sb-lg overflow-hidden relative"
      style={{
        background: "linear-gradient(135deg, #5B4A36 0%, #3D2E20 100%)",
        boxShadow: "var(--shadow-sb-pop)",
      }}
    >
      <div
        className="absolute -top-8 -right-8 w-32 h-32 rounded-full pointer-events-none"
        style={{ background: "radial-gradient(circle, rgba(255,201,93,0.35) 0%, transparent 70%)" }}
      />
      <div className="relative px-5 py-4">
        <div
          className="text-[10.5px] font-extrabold tracking-wider uppercase mb-1"
          style={{ color: "var(--sb-yuzu-light)" }}
        >
          ✨ 시크릿 솔루션
        </div>
        <div className="flex items-center gap-2 mb-2">
          <h3 className="text-[16px] font-extrabold text-white tracking-tight leading-snug flex-1">
            {secret.title}
          </h3>
          {!isPaid && (
            <span className="text-[14px]" style={{ color: "var(--sb-yuzu-light)" }}>
              🔒
            </span>
          )}
        </div>
        {isPaid && secret.body && (
          <p className="text-[13.5px] text-white/90 leading-relaxed whitespace-pre-wrap">
            {secret.body}
          </p>
        )}
      </div>
    </section>
  );
}

function FinalGuideCard({ guide }: { guide: DaewoonReport["finalGuide"] }) {
  const hasBody = guide.summary || guide.dos.length > 0 || guide.avoids.length > 0 || guide.nextStep;
  if (!hasBody) return null;
  return (
    <section
      className="rounded-sb-xl overflow-hidden bg-sb-paper"
      style={{
        boxShadow: "var(--shadow-sb-pop), inset 0 0 0 1px rgba(91,74,54,0.06)",
      }}
    >
      <div
        className="px-5 py-4"
        style={{
          background: "linear-gradient(135deg, rgba(255,232,143,0.7), rgba(255,255,248,0.9))",
        }}
      >
        <div className="text-[10.5px] font-extrabold text-sb-terra-dark tracking-wider uppercase mb-1">
          🧾 마지막 정리
        </div>
        <h3 className="text-[17px] font-extrabold text-sb-ink tracking-tight leading-snug">
          {guide.title}
        </h3>
      </div>
      <div className="px-5 py-4 flex flex-col gap-3.5">
        {guide.summary && (
          <p className="text-[13.5px] text-sb-ink-2 leading-[1.85] whitespace-pre-wrap">
            {guide.summary}
          </p>
        )}
        {(guide.dos.length > 0 || guide.avoids.length > 0) && (
          <div className="grid grid-cols-1 gap-2.5">
            {guide.dos.length > 0 && (
              <GuideList title="잡아야 할 것" mark="✓" items={guide.dos} tone="do" />
            )}
            {guide.avoids.length > 0 && (
              <GuideList title="피해야 할 것" mark="!" items={guide.avoids} tone="avoid" />
            )}
          </div>
        )}
        {guide.nextStep && (
          <div
            className="rounded-sb-md px-3.5 py-3 text-[13px] font-bold leading-relaxed"
            style={{
              background: "rgba(199,223,166,0.35)",
              color: "var(--sb-olive-dark)",
            }}
          >
            오늘의 한 행동: {guide.nextStep}
          </div>
        )}
      </div>
    </section>
  );
}

function GuideList({
  title,
  mark,
  items,
  tone,
}: {
  title: string;
  mark: string;
  items: string[];
  tone: "do" | "avoid";
}) {
  const color = tone === "do" ? "var(--sb-olive-dark)" : "var(--sb-terra-dark)";
  const bg = tone === "do" ? "rgba(199,223,166,0.28)" : "rgba(209,134,99,0.12)";
  return (
    <div className="rounded-sb-md px-3.5 py-3" style={{ background: bg }}>
      <div className="text-[11px] font-extrabold mb-2" style={{ color }}>
        {title}
      </div>
      <ul className="flex flex-col gap-1.5">
        {items.map((item) => (
          <li key={item} className="flex gap-2 text-[12.5px] text-sb-ink-2 leading-relaxed">
            <span className="font-extrabold shrink-0" style={{ color }}>
              {mark}
            </span>
            <span>{item}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}

// ============================================================
// Past / Future period preview cards (clickable)
// ============================================================

function PastSummaries({
  summaries,
  periods,
  qs,
  unlockedPeriodIndexes,
}: {
  summaries: DaewoonReport["pastSummaries"];
  periods: DaewoonItem[];
  qs: string;
  unlockedPeriodIndexes: number[];
}) {
  const byIdx = new Map(periods.map((p) => [p.index, p]));
  const unlocked = new Set(unlockedPeriodIndexes);
  return (
    <section className="flex flex-col gap-2">
      <div className="text-[10.5px] font-extrabold text-sb-ink-3 tracking-wider uppercase px-1">
        ⏮ 이전 대운 — 눌러서 회고
      </div>
      {summaries.map((s) => {
        const p = byIdx.get(s.index);
        if (!p) return null;
        return (
          <PeriodPreviewCard
            key={s.index}
            period={p}
            subtitle={s.subtitle}
            qs={qs}
            alreadyUnlocked={unlocked.has(s.index)}
          />
        );
      })}
    </section>
  );
}

function FutureList({
  teasers,
  periods,
  qs,
  unlockedPeriodIndexes,
}: {
  teasers: DaewoonReport["futureTeasers"];
  periods: DaewoonItem[];
  qs: string;
  unlockedPeriodIndexes: number[];
}) {
  const byIdx = new Map(periods.map((p) => [p.index, p]));
  const unlocked = new Set(unlockedPeriodIndexes);
  return (
    <section className="flex flex-col gap-2">
      <div className="text-[10.5px] font-extrabold text-sb-ink-3 tracking-wider uppercase px-1">
        🔮 다음 대운 — 눌러서 상세 해설로
      </div>
      {teasers.map((t) => {
        const p = byIdx.get(t.index);
        if (!p) return null;
        const alreadyUnlocked = unlocked.has(t.index);
        return (
          <PeriodPreviewCard
            key={t.index}
            period={p}
            subtitle={t.subtitle}
            qs={qs}
            locked={!alreadyUnlocked}
            alreadyUnlocked={alreadyUnlocked}
          />
        );
      })}
    </section>
  );
}

function PeriodPreviewCard({
  period,
  subtitle,
  qs,
  locked = false,
  alreadyUnlocked = false,
}: {
  period: DaewoonItem;
  subtitle: string;
  qs: string;
  locked?: boolean;
  alreadyUnlocked?: boolean;
}) {
  const sc = ELEMENT_COLORS[period.stem.element];
  const bc = ELEMENT_COLORS[period.branch.element];
  return (
    <DaewoonPeriodSwitchLink
      href={focusHref(qs, period.index)}
      periodLabel={`${period.startAge}~${period.endAge}세`}
      alreadyUnlocked={alreadyUnlocked}
      className="block w-full text-left bg-sb-paper rounded-sb-lg px-3.5 py-3 active:scale-[0.99] transition-transform border-0"
      style={{ boxShadow: "var(--shadow-sb-card), inset 0 0 0 1px rgba(91,74,54,0.06)" }}
    >
      <div className="flex items-center gap-2">
        <div className="flex flex-col items-center w-12 shrink-0">
          <span className="text-[11px] font-extrabold text-sb-ink tabular-nums leading-none">
            {period.startAge}~{period.endAge}
          </span>
          <span className="text-[9px] font-bold text-sb-ink-3 mt-0.5">
            {period.index + 1}번째
          </span>
        </div>
        <div className="flex gap-0.5 shrink-0">
          <div
            className="w-7 h-7 rounded flex items-center justify-center text-[13px] font-extrabold"
            style={{ background: sc.bg, color: sc.ink }}
          >
            {period.stem.hanja}
          </div>
          <div
            className="w-7 h-7 rounded flex items-center justify-center text-[13px] font-extrabold"
            style={{ background: bc.bg, color: bc.ink }}
          >
            {period.branch.hanja}
          </div>
        </div>
        <p className="text-[12.5px] font-bold text-sb-ink-2 leading-snug flex-1 min-w-0">
          {subtitle}
        </p>
        {locked && (
          <span className="text-[11px] font-extrabold text-sb-terra-dark shrink-0">🔒</span>
        )}
        {alreadyUnlocked && (
          <span className="text-[11px] font-extrabold text-sb-olive-dark shrink-0">🔓</span>
        )}
        <svg
          width="11"
          height="11"
          viewBox="0 0 10 10"
          fill="none"
          aria-hidden
          className="shrink-0 ml-0.5"
        >
          <path
            d="M3.5 2L6.5 5L3.5 8"
            stroke="var(--sb-ink-3)"
            strokeWidth="1.8"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      </div>
    </DaewoonPeriodSwitchLink>
  );
}

// ============================================================
// Sticky paywall bar
// ============================================================

function StickyPaywall({
  qs,
  period,
  input,
}: {
  qs: string;
  period: DaewoonItem;
  input: SajuInput;
}) {
  return (
    <StickyPaywallLink
      href={paidHref(qs, period, input)}
      label={`🔒 990원으로 ${period.startAge}~${period.endAge}세 대운 열기`}
      observeTargetId="daewoon-primary-paywall-cta"
    />
  );
}

// ============================================================
// Error & helpers
// ============================================================

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
        🌊 대운 해설
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
          background: "linear-gradient(170deg, #DDE7C8 0%, #C7DFA6 100%)",
          boxShadow: "var(--shadow-sb-hero), inset 0 1px 0 rgba(255,255,255,0.5)",
        }}
      >
        <div className="text-[48px] mb-2">🌊</div>
        <h1 className="text-[18px] font-extrabold text-sb-ink mb-1.5 tracking-tight">
          대운 해설 정보를 입력해 주세요
        </h1>
        <p className="text-[13px] text-sb-ink-2 leading-relaxed mb-5">
          생년월일·시간을 등록하면
          <br />
          대운 10년 집중 해설을 풀어드려요.
        </p>
        <Link
          href="/saju?next=daewoon"
          className="inline-flex items-center gap-1.5 rounded-full bg-sb-olive text-white text-[13px] font-bold px-4 py-2.5"
          style={{ boxShadow: "0 2px 6px rgba(92,110,62,0.3)" }}
        >
          대운 정보 입력하기
          <svg width="10" height="10" viewBox="0 0 10 10" fill="none" aria-hidden>
            <path
              d="M3.5 2L6.5 5L3.5 8"
              stroke="white"
              strokeWidth="1.8"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        </Link>
      </div>
    </div>
  );
}

async function getUnlockedDaewoonIndexes(
  periods: DaewoonItem[],
  input: SajuInput,
): Promise<number[]> {
  const personKey = sajuPersonKey(input);
  const checks = await Promise.all(
    periods.map(async (period) => {
      const byIndex = await canViewPaidContent(false, {
        product: "daewoon",
        period: period.index,
        personKey,
      });
      const byCurrent = period.isCurrent
        ? await canViewPaidContent(false, {
            product: "daewoon",
            period: "current",
            personKey,
          })
        : false;
      return byIndex || byCurrent ? period.index : null;
    }),
  );
  return checks.filter((index): index is number => typeof index === "number");
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
  if (sp.index) obj.index = sp.index;
  return new URLSearchParams(obj).toString();
}

function paidHref(qs: string, period: DaewoonItem, input: SajuInput): string {
  const p = new URLSearchParams(qs);
  p.set("paid", "1");
  const periodScope = period.isCurrent ? "current" : String(period.index);
  return checkoutHref({
    amount: 990,
    product: `daewoon:${sajuPersonKey(input)}:${periodScope}`,
    returnTo: `/daewoon?${p.toString()}`,
    title: "대운 전체 해설",
  });
}

function focusHref(qs: string, index: number): string {
  const p = new URLSearchParams(qs);
  p.set("index", String(index));
  p.delete("paid");
  return `/daewoon?${p.toString()}#daewoon-report`;
}
