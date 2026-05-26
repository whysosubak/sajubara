import Link from "next/link";
import { Suspense } from "react";
import ContentDisclaimer from "@/app/components/ContentDisclaimer";
import ReportAccessPanel from "@/app/components/ReportAccessPanel";
import ReportGenerationLoading from "@/app/components/ReportGenerationLoading";
import ReportUtilityActions from "@/app/components/ReportUtilityActions";
import StickyPaywallLink from "@/app/components/StickyPaywallLink";
import { buildReportAccessItems } from "@/lib/auth/report-access";
import { canViewPaidContent } from "@/lib/auth/paid";
import { checkoutHref } from "@/lib/payments/checkout";
import { computeChart, type SajuChart, type YearlyItem } from "@/lib/saju/chart";
import {
  YEAR_FORTUNE_META,
  YEAR_FORTUNE_ORDER,
  generateYearDetail,
  type YearDetail,
  type YearMonth,
  type YearSecret,
} from "@/lib/saju/generate";
import type {
  CalendarType,
  Gender,
  JobStatus,
  LoveStatus,
  SajuInput,
} from "@/lib/saju/types";
import { JOB_STATUSES, LOVE_STATUSES } from "@/lib/saju/types";
import { computeKeySignals } from "@/lib/saju/signals";
import { monthStem, tenGod } from "@/lib/saju/subtitle-pool";
import { sajuPersonKey } from "@/lib/saju/scope";

type RouteParams = Promise<{ year: string }>;
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

export default async function YearDetailPage({
  params,
  searchParams,
}: {
  params: RouteParams;
  searchParams: SearchParams;
}) {
  const { year: yearStr } = await params;
  const year = parseInt(yearStr, 10);
  const sp = await searchParams;
  const input = parseInput(sp);
  const isPaid = input && Number.isFinite(year)
    ? await canViewPaidContent(sp.paid === "1", {
        product: "yearly",
        year,
        personKey: sajuPersonKey(input),
      })
    : false;
  const qs = inputToQs(sp);
  const backHref = qs ? `/yearly?${qs}` : "/yearly";
  const emptyHref =
    input || !Number.isFinite(year) ? backHref : `/saju?next=yearly&year=${year}`;

  return (
    <>
      <Header year={Number.isFinite(year) ? year : undefined} backHref={backHref} />
      <div className="flex-1 overflow-y-auto pb-36">
        {!input || !Number.isFinite(year) ? (
          <EmptyState backHref={emptyHref} />
        ) : (
          <DetailBody input={input} year={year} backHref={backHref} isPaid={isPaid} qs={qs} />
        )}
      </div>
      {input && Number.isFinite(year) && !isPaid && (
        <StickyPaywall qs={qs} year={year} input={input} />
      )}
    </>
  );
}

async function DetailBody({
  input,
  year,
  backHref,
  isPaid,
  qs,
}: {
  input: SajuInput;
  year: number;
  backHref: string;
  isPaid: boolean;
  qs: string;
}) {
  let chart: SajuChart;
  try {
    chart = await computeChart(input);
  } catch (e) {
    return (
      <ErrorCard
        message={e instanceof Error ? e.message : "사주를 못 뽑았어요."}
        backHref={backHref}
      />
    );
  }

  const target = chart.yearlyList.find((y) => y.year === year);
  if (!target) {
    return (
      <ErrorCard
        message={`${year}년은 가져온 운세 범위(${chart.yearlyList[0]?.year}~${chart.yearlyList.at(-1)?.year})에 없어요.`}
        backHref={backHref}
      />
    );
  }

  const hasKey = !!process.env.OPENAI_API_KEY;
  const accessItems = isPaid ? await buildReportAccessItems(input, year) : [];

  return (
    <main className="flex flex-col gap-3 px-4 pt-3">
      <HeroIntro name={input.name} item={target} />
      {hasKey ? (
        <Suspense
          fallback={
            <ReportGenerationLoading
              visual="yearly"
              eyebrow={isPaid ? "PAID REPORT GENERATING" : "FREE SAMPLE GENERATING"}
              title={`${input.name}님의 ${year}년 운세를 해석하는 중이에요`}
              description="만세력과 월운 흐름을 맞춰보고, 12개월·연애·인간관계·금전·직업·건강·성장운을 정리하고 있어요."
              steps={[
                "올해 세운과 대운 관계 확인",
                "월별 흐름과 주의 시점 정리",
                isPaid ? "구매한 상세 본문 생성" : "무료 샘플 문장 준비",
              ]}
            />
          }
        >
          <GeneratedYearReport
            input={input}
            chart={chart}
            target={target}
            year={year}
            isPaid={isPaid}
            qs={qs}
            accessItems={accessItems}
          />
        </Suspense>
      ) : (
        <NoKeyCard />
      )}
    </main>
  );
}

async function GeneratedYearReport({
  input,
  chart,
  target,
  year,
  isPaid,
  qs,
  accessItems,
}: {
  input: SajuInput;
  chart: SajuChart;
  target: YearlyItem;
  year: number;
  isPaid: boolean;
  qs: string;
  accessItems: Awaited<ReturnType<typeof buildReportAccessItems>>;
}) {
  let detail: YearDetail;
  try {
    detail = await generateYearDetail(input, chart, year, !isPaid);
  } catch (e) {
    return (
      <ErrorCard
        message={e instanceof Error ? e.message : "해설을 못 가져왔어요."}
        backHref="/yearly"
      />
    );
  }
  const printQs = new URLSearchParams(qs);
  if (isPaid) printQs.set("paid", "1");
  const pdfHref = `/reports/yearly/${year}/print?${printQs.toString()}`;

  return (
    <>
      <ReportUtilityActions
        title={`${input.name}님의 ${year}년 연도별 운세`}
        description="사주바라에서 본 연도별 운세예요."
        pdfHref={pdfHref}
      />
      <ContentDisclaimer compact />
      <ContextSnapshot input={input} />
      <NatalManseryeok chart={chart} />
      <YearManseryeok chart={chart} target={target} />
      <MonthlyManseryeok
        year={year}
        yearStem={target.stem.hanja}
        dayStem={chart.dayMaster.hanja}
        dayBranch={chart.pillars.find((p) => p.isDayMaster)?.branch.hanja ?? "子"}
        natalBranches={chart.pillars.map((p) => p.branch.hanja)}
      />
      <SpoilerCard detail={detail} />
      {!isPaid && <PaywallValueProp year={year} qs={qs} input={input} />}
      <MonthlyList months={detail.months} isPaid={isPaid} />
      <FortuneList fortunes={detail.fortunes} isPaid={isPaid} />
      <SecretList items={detail.secret} isPaid={isPaid} />
      {isPaid && <ReportAccessPanel items={accessItems} />}
      <CrossSell />
      <p className="text-[11px] text-sb-ink-3 leading-relaxed px-1 mt-2">
        ※ 세운은 한 해 천간·지지가 본인 일간과 만나서 만드는 1년 단위의 결. 1~3월·시크릿 1번은 무료 샘플이에요.
      </p>
    </>
  );
}

// ============================================================
// Manseryeok evidence blocks
// ============================================================

function ContextSnapshot({ input }: { input: SajuInput }) {
  const chips = [
    input.loveStatus ? `연애 ${input.loveStatus}` : undefined,
    input.jobStatus ? `일 ${input.jobStatus}` : undefined,
  ].filter(Boolean);

  if (chips.length === 0) return null;
  return (
    <section
      className="bg-sb-paper rounded-sb-lg px-4 py-3"
      style={{ boxShadow: "var(--shadow-sb-card), inset 0 0 0 1px rgba(91,74,54,0.06)" }}
    >
      <div className="text-[10.5px] font-extrabold text-sb-olive-dark tracking-wider uppercase mb-2">
        현재 상황
      </div>
      <div className="flex flex-wrap gap-2">
        {chips.map((chip) => (
          <span
            key={chip}
            className="rounded-full bg-sb-cream px-3 py-1.5 text-[12px] font-extrabold text-sb-ink-2"
            style={{ boxShadow: "inset 0 0 0 1px var(--sb-hairline)" }}
          >
            {chip}
          </span>
        ))}
      </div>
    </section>
  );
}

function NatalManseryeok({ chart }: { chart: SajuChart }) {
  const signals = computeKeySignals(chart).slice(0, 8);
  return (
    <details
      className="rounded-sb-xl overflow-hidden"
      style={{
        background:
          "linear-gradient(180deg, rgba(255,253,245,0.96) 0%, rgba(234,244,238,0.92) 100%)",
        boxShadow: "var(--shadow-sb-card), inset 0 0 0 1px rgba(91,74,54,0.06)",
      }}
      open
    >
      <summary
        className="cursor-pointer px-4 py-3 flex items-center justify-between"
        style={{ background: "linear-gradient(135deg, #77BDB6 0%, #5EA9A2 100%)" }}
      >
        <span className="text-[18px] font-extrabold text-white tracking-tight">내 만세력</span>
        <span className="text-[11px] font-extrabold text-white/80">사주 4기둥</span>
      </summary>
      <div className="grid grid-cols-4 gap-2 p-3">
        {chart.pillars.map((p) => (
          <PillarStack
            key={`${p.position}-pillar`}
            label={`${p.position}주`}
            stem={p.stem.hanja}
            branch={p.branch.hanja}
            stemTenGod={p.stemTenGod}
            branchTenGod={p.branchTenGod}
            twelveStage={p.twelveStage}
            sinsals={p.sinsals}
            relations={p.relations}
            active={p.isDayMaster}
          />
        ))}
      </div>
      {signals.length > 0 && (
        <div className="px-4 pb-4 pt-1">
          <div className="mb-2 text-[10.5px] font-extrabold text-sb-ink-3 tracking-wider uppercase">
            해석 근거
          </div>
          <div className="flex flex-wrap gap-1.5">
            {signals.map((signal) => (
              <span
                key={signal}
                className="rounded-full px-2 py-1 text-[10.5px] font-bold text-sb-ink-2"
                style={{ background: "rgba(92,110,62,0.1)" }}
              >
                {signal}
              </span>
            ))}
          </div>
        </div>
      )}
    </details>
  );
}

function YearManseryeok({
  chart,
  target,
}: {
  chart: SajuChart;
  target: YearlyItem;
}) {
  const luckStem = chart.currentLuck?.stem;
  const luckBranch = chart.currentLuck?.branch;
  const dayStem = chart.dayMaster.hanja;
  const dayBranch = chart.pillars.find((p) => p.isDayMaster)?.branch.hanja ?? "子";
  const natalBranches = chart.pillars.map((p) => p.branch.hanja);
  return (
    <details
      className="rounded-sb-xl overflow-hidden"
      style={{
        background:
          "linear-gradient(180deg, rgba(255,253,245,0.96) 0%, rgba(238,242,233,0.92) 100%)",
        boxShadow: "var(--shadow-sb-card), inset 0 0 0 1px rgba(91,74,54,0.06)",
      }}
      open
    >
      <summary
        className="cursor-pointer px-4 py-3 flex items-center justify-between"
        style={{ background: "linear-gradient(135deg, #77BDB6 0%, #5EA9A2 100%)" }}
      >
        <span className="text-[18px] font-extrabold text-white tracking-tight">운세 만세력</span>
        <span className="text-[11px] font-extrabold text-white/80">대운 × 연운</span>
      </summary>
      <div className="grid grid-cols-2 gap-2 p-3">
        {luckStem && luckBranch ? (
          <PillarStack
            label="대운"
            stem={luckStem}
            branch={luckBranch}
            stemTenGod={tenGodLabel(chart.dayMaster.hanja, luckStem)}
            branchTenGod={branchTenGodLabel(chart.dayMaster.hanja, luckBranch)}
            twelveStage={twelveStageFor(dayStem, luckBranch)}
            sinsals={branchSinsals(dayBranch, luckBranch)}
            relations={branchRelations(natalBranches, luckBranch)}
          />
        ) : (
          <div className="px-3 py-5 text-center text-[12px] text-sb-ink-3">대운 정보 없음</div>
        )}
        <PillarStack
          label={`연운 ${target.year}`}
          stem={target.stem.hanja}
          branch={target.branch.hanja}
          stemTenGod={tenGodLabel(chart.dayMaster.hanja, target.stem.hanja)}
          branchTenGod={branchTenGodLabel(chart.dayMaster.hanja, target.branch.hanja)}
          twelveStage={twelveStageFor(dayStem, target.branch.hanja)}
          sinsals={branchSinsals(dayBranch, target.branch.hanja)}
          relations={branchRelations(natalBranches, target.branch.hanja)}
        />
      </div>
    </details>
  );
}

function MonthlyManseryeok({
  year,
  yearStem,
  dayStem,
  dayBranch,
  natalBranches,
}: {
  year: number;
  yearStem: string;
  dayStem: string;
  dayBranch: string;
  natalBranches: string[];
}) {
  return (
    <section
      className="rounded-sb-xl overflow-hidden"
      style={{
        background:
          "linear-gradient(180deg, rgba(255,253,245,0.96) 0%, rgba(255,247,226,0.96) 100%)",
        boxShadow: "var(--shadow-sb-card), inset 0 0 0 1px rgba(91,74,54,0.06)",
      }}
    >
      <div
        className="px-4 py-3 flex items-center justify-between"
        style={{ background: "linear-gradient(135deg, #F3DFAE 0%, #F8E8C2 100%)" }}
      >
        <span className="text-[18px] font-extrabold text-sb-terra-dark tracking-tight">
          월운 만세력
        </span>
        <span className="text-[11px] font-extrabold text-sb-ink-3">12개월 흐름</span>
      </div>
      <MonthHalf
        title="상반기"
        months={[1, 2, 3, 4, 5, 6]}
        yearStem={yearStem}
        dayStem={dayStem}
        dayBranch={dayBranch}
        natalBranches={natalBranches}
        year={year}
      />
      <div className="h-px bg-sb-hairline mx-3" />
      <MonthHalf
        title="하반기"
        months={[7, 8, 9, 10, 11, 12]}
        yearStem={yearStem}
        dayStem={dayStem}
        dayBranch={dayBranch}
        natalBranches={natalBranches}
        year={year}
      />
    </section>
  );
}

function MonthHalf({
  title,
  months,
  yearStem,
  dayStem,
  dayBranch,
  natalBranches,
  year,
}: {
  title: string;
  months: number[];
  yearStem: string;
  dayStem: string;
  dayBranch: string;
  natalBranches: string[];
  year: number;
}) {
  return (
    <div className="px-3 py-3">
      <div className="mb-2 flex items-center gap-2 text-[12px] font-extrabold text-sb-ink-3">
        <span className="h-px flex-1 bg-sb-hairline" />
        {year} · {title}
        <span className="h-px flex-1 bg-sb-hairline" />
      </div>
      <div className="grid grid-cols-3 gap-2 auto-rows-[166px]">
        {months.map((month) => {
          const stem = monthStem(yearStem, month);
          const branch = MONTH_BRANCHES[month - 1];
          const sinsals = branchSinsals(dayBranch, branch);
          const relations = branchRelations(natalBranches, branch);
          const stage = twelveStageFor(dayStem, branch);
          return (
            <div
              key={month}
              className="h-full rounded-[18px] bg-white/55 px-2.5 py-2.5 flex flex-col"
              style={{ boxShadow: "inset 0 0 0 1px rgba(91,74,54,0.08)" }}
            >
              <div className="h-5 shrink-0 text-center text-[12px] font-extrabold text-sb-ink-2 leading-5">
                {month}월
              </div>
              <MonthGanjiTile
                stem={stem}
                branch={branch}
                stemLabel={tenGodLabel(dayStem, stem)}
                branchLabel={branchTenGodLabel(dayStem, branch)}
                tags={[stage, ...sinsals, ...relations]}
              />
            </div>
          );
        })}
      </div>
    </div>
  );
}

function PillarStack({
  label,
  stem,
  branch,
  stemTenGod,
  branchTenGod,
  twelveStage,
  sinsals = [],
  relations = [],
  active = false,
}: {
  label?: string;
  stem: string;
  branch: string;
  stemTenGod: string;
  branchTenGod: string;
  twelveStage?: string;
  sinsals?: string[];
  relations?: string[];
  active?: boolean;
}) {
  return (
    <div
      className="rounded-[18px] p-1.5"
      style={{
        background: active ? "rgba(255,201,93,0.2)" : "rgba(255,255,255,0.46)",
        boxShadow: active
          ? "inset 0 0 0 1px rgba(216,154,42,0.34), 0 6px 16px rgba(91,74,54,0.08)"
          : "inset 0 0 0 1px rgba(91,74,54,0.08)",
      }}
    >
      {label && (
        <div className="pb-1.5 text-center text-[11px] font-extrabold text-sb-ink-3">
          {label}
        </div>
      )}
      <div className="flex flex-col gap-1.5">
        <LargeGanjiCell hanja={stem} label={stemTenGod} />
        <LargeGanjiCell hanja={branch} label={branchTenGod} />
      </div>
      <div className="mt-1.5 flex flex-col gap-1">
        <PillarMetaRow label="12운성" value={twelveStage ?? "-"} />
        <PillarMetaRow label="신살" value={sinsals.length > 0 ? sinsals.join("\n") : "-"} />
        <PillarMetaRow label="합충" value={relations.length > 0 ? relations.join("\n") : "-"} />
      </div>
    </div>
  );
}

function LargeGanjiCell({ hanja, label }: { hanja: string; label: string }) {
  const cell = ganjiCell(hanja);
  const colors = ELEMENT_COLORS[cell.element] ?? ELEMENT_COLORS.earth;
  return (
    <div
      className="min-h-[78px] flex flex-col items-center justify-center rounded-[14px]"
      style={{
        background: colors.bg,
        color: colors.ink,
        boxShadow: "inset 0 0 0 1px rgba(255,255,255,0.44)",
      }}
    >
      <div className="text-[31px] font-extrabold leading-none">{hanja}</div>
      <div className="mt-2 text-[12px] font-extrabold">{cell.korean}</div>
      <div className="text-[11px] font-bold opacity-85">{label}</div>
    </div>
  );
}

function PillarMetaRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="min-h-[38px] rounded-[10px] px-1.5 py-1.5 flex flex-col items-center justify-center gap-0.5 bg-white/48">
      <div className="text-[8px] font-extrabold text-sb-ink-3">{label}</div>
      <div className="whitespace-pre-line text-center text-[9.5px] leading-snug font-bold text-sb-ink-2">
        {value}
      </div>
    </div>
  );
}

function MonthGanjiTile({
  stem,
  branch,
  stemLabel,
  branchLabel,
  tags,
}: {
  stem: string;
  branch: string;
  stemLabel: string;
  branchLabel: string;
  tags: string[];
}) {
  const stemCell = ganjiCell(stem);
  const branchCell = ganjiCell(branch);
  const colors = ELEMENT_COLORS[branchCell.element] ?? ELEMENT_COLORS.earth;
  const visibleTags = tags.filter((tag) => tag && tag !== "-").slice(0, 3);
  return (
    <div
      className="mt-1 min-h-0 flex-1 rounded-[14px] px-2 py-2 flex flex-col items-center justify-center overflow-hidden"
      style={{
        background: colors.bg,
        color: colors.ink,
        boxShadow: "inset 0 0 0 1px rgba(255,255,255,0.5)",
      }}
    >
      <div className="text-[27px] font-extrabold leading-none tracking-tight">
        {stem}{branch}
      </div>
      <div className="mt-1 text-[10px] font-extrabold opacity-80">
        {stemCell.korean}{branchCell.korean}
      </div>
      <div className="mt-1 text-[10px] font-bold opacity-85 text-center leading-tight">
        {stemLabel} · {branchLabel}
      </div>
      <div className="mt-2 min-h-[34px] flex flex-wrap justify-center content-start gap-1 overflow-hidden">
        {visibleTags.length > 0 ? (
          visibleTags.map((tag) => (
            <span
              key={tag}
              className="rounded-full bg-white/50 px-1.5 py-[1px] text-[8.5px] font-extrabold"
            >
              {tag}
            </span>
          ))
        ) : (
          <span aria-hidden className="invisible rounded-full px-1.5 py-[1px] text-[8.5px] font-extrabold">
            태그
          </span>
        )}
      </div>
    </div>
  );
}

// ============================================================
// Spoiler (free overview)
// ============================================================

function SpoilerCard({ detail }: { detail: YearDetail }) {
  return (
    <section
      className="bg-sb-paper rounded-sb-lg px-4 py-4"
      style={{ boxShadow: "var(--shadow-sb-card), inset 0 0 0 1px rgba(91,74,54,0.06)" }}
    >
      <div className="text-[10.5px] font-extrabold text-sb-terra-dark tracking-wider uppercase mb-1">
        🌊 한 해 총평
      </div>
      <h2 className="text-[15px] font-extrabold text-sb-ink tracking-tight leading-snug mb-1.5">
        {detail.headline}
      </h2>
      {detail.overview && <ReportBodyText text={detail.overview} compact />}
    </section>
  );
}

// ============================================================
// Paywall value-prop (CTA above first locked section)
// ============================================================

function PaywallValueProp({
  year,
  qs,
  input,
}: {
  year: number;
  qs: string;
  input: SajuInput;
}) {
  const unlockHref = paidHref(qs, year, input);
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
        <div
          className="text-[10.5px] font-extrabold tracking-wider uppercase"
          style={{ color: "var(--sb-yuzu-light)" }}
        >
          🔒 {year}년 전체 해설
        </div>
        <Link
          id="yearly-detail-primary-paywall-cta"
          href={unlockHref}
          className="rounded-full px-4 py-3 text-[14px] font-extrabold tracking-tight text-center"
          style={{
            background:
              "linear-gradient(135deg, var(--sb-yuzu-light), var(--sb-yuzu) 60%, var(--sb-yuzu-dark))",
            color: "var(--sb-olive-dark)",
            boxShadow: "0 4px 14px rgba(216,154,42,0.5)",
          }}
        >
          990원으로 {year}년 전체 열기
        </Link>
        <ul className="flex flex-col gap-1 mt-1">
          {[
            "12개월 상세 (4~12월 잠금 해제)",
            "6대 운세 본문 (연애·인간관계·금전·직업·건강·성장)",
            "시크릿 솔루션 4종 전체",
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
      </div>
    </section>
  );
}

// ============================================================
// 12 months list (1~3 free sample, rest locked)
// ============================================================

function MonthlyList({ months, isPaid }: { months: YearMonth[]; isPaid: boolean }) {
  return (
    <section className="flex flex-col gap-2">
      <div className="text-[10.5px] font-extrabold text-sb-olive-dark tracking-wider uppercase px-1">
        📅 12개월 흐름
      </div>
      {months.map((m) => (
        <MonthCard key={m.month} data={m} isPaid={isPaid} />
      ))}
    </section>
  );
}

function MonthCard({ data, isPaid }: { data: YearMonth; isPaid: boolean }) {
  const showFullBody = isPaid || data.isSampleFree;
  const paidUnlocked = isPaid && !data.isSampleFree;
  return (
    <article
      className="bg-sb-paper rounded-sb-lg px-4 py-4"
      style={{
        boxShadow: paidUnlocked
          ? "var(--shadow-sb-card), inset 0 0 0 1.5px rgba(92,110,62,0.22)"
          : data.isSampleFree
            ? "var(--shadow-sb-card), inset 0 0 0 1.5px rgba(216,154,42,0.4)"
            : "var(--shadow-sb-card), inset 0 0 0 1px rgba(91,74,54,0.06)",
        background: data.isSampleFree ? "var(--sb-cream)" : "var(--sb-paper)",
      }}
    >
      <div className="flex items-center gap-2 mb-1.5">
        <span className="text-[12.5px] font-extrabold text-sb-ink tabular-nums w-10 shrink-0">
          {data.month}월
        </span>
        {data.isSampleFree && (
          <span
            className="text-[8.5px] font-extrabold px-1.5 py-[1px] rounded-full"
            style={{ background: "var(--sb-yuzu)", color: "var(--sb-olive-dark)" }}
          >
            샘플 무료
          </span>
        )}
        {paidUnlocked && (
          <span
            className="text-[8.5px] font-extrabold px-1.5 py-[1px] rounded-full"
            style={{ background: "rgba(92,110,62,0.12)", color: "var(--sb-olive-dark)" }}
          >
            유료 상세
          </span>
        )}
        {!showFullBody && (
          <span className="ml-auto text-[11px] font-extrabold text-sb-terra-dark">🔒</span>
        )}
      </div>
      <h3 className="text-[15px] font-extrabold text-sb-ink leading-snug tracking-tight">
        {data.subtitle}
      </h3>
      {showFullBody ? (
        data.body && <ReportBodyText text={data.body} />
      ) : (
        data.bodyTeaser && (
          <p className="text-[12px] text-sb-ink-3 leading-relaxed mt-1.5 italic">
            {data.bodyTeaser}
          </p>
        )
      )}
    </article>
  );
}

// ============================================================
// 6 fortune categories list (subtitle free, body locked)
// ============================================================

function FortuneList({
  fortunes,
  isPaid,
}: {
  fortunes: YearDetail["fortunes"];
  isPaid: boolean;
}) {
  return (
    <section className="flex flex-col gap-2">
      <div className="text-[10.5px] font-extrabold text-sb-terra-dark tracking-wider uppercase px-1">
        ✨ 6대 운세
      </div>
      {fortunes.map((f) => {
        const meta = YEAR_FORTUNE_META[f.key];
        return (
          <article
            key={f.key}
            className="bg-sb-paper rounded-sb-lg px-4 py-3"
            style={{ boxShadow: "var(--shadow-sb-card), inset 0 0 0 1px rgba(91,74,54,0.06)" }}
          >
            <div className="flex items-center gap-1.5 mb-1">
              <span className="text-[14px]">{meta.emoji}</span>
              <span className="text-[10.5px] font-extrabold text-sb-olive-dark tracking-wider uppercase">
                {meta.title}
              </span>
              {!isPaid && (
                <span className="ml-auto text-[11px] font-extrabold text-sb-terra-dark">🔒</span>
              )}
            </div>
            <h3 className="text-[13.5px] font-extrabold text-sb-ink leading-snug tracking-tight">
              {f.subtitle}
            </h3>
            {isPaid ? (
              f.body && <ReportBodyText text={f.body} />
            ) : (
              f.bodyTeaser && (
                <p className="text-[12px] text-sb-ink-3 leading-relaxed mt-1.5 italic">
                  {f.bodyTeaser}
                </p>
              )
            )}
          </article>
        );
      })}
      {/* unused but kept for fortune order consistency hint */}
      <input type="hidden" data-order={YEAR_FORTUNE_ORDER.join(",")} />
    </section>
  );
}

// ============================================================
// Secret solutions — 4 cards, [0] free
// ============================================================

function SecretList({ items, isPaid }: { items: YearSecret[]; isPaid: boolean }) {
  return (
    <section className="flex flex-col gap-2">
      <div className="text-[10.5px] font-extrabold text-sb-ink-3 tracking-wider uppercase px-1">
        ⏳ 시크릿 솔루션 4종
      </div>
      {items.map((s, i) => {
        const free = !s.isLocked || isPaid;
        return (
          <article
            key={i}
            className="rounded-sb-lg overflow-hidden relative"
            style={{
              background: free
                ? "linear-gradient(135deg, #5B4A36 0%, #3D2E20 100%)"
                : "linear-gradient(135deg, #6B5B47 0%, #4A3B2A 100%)",
              boxShadow: "var(--shadow-sb-pop)",
            }}
          >
            <div
              className="absolute -top-8 -right-8 w-28 h-28 rounded-full pointer-events-none"
              style={{
                background: free
                  ? "radial-gradient(circle, rgba(255,201,93,0.3) 0%, transparent 70%)"
                  : "radial-gradient(circle, rgba(255,201,93,0.12) 0%, transparent 70%)",
              }}
            />
            <div className="relative px-5 py-4">
              <div className="flex items-center gap-1.5 mb-1">
                <span className="text-[14px]">{s.emoji}</span>
                <span
                  className="text-[10.5px] font-extrabold tracking-wider uppercase"
                  style={{ color: "var(--sb-yuzu-light)" }}
                >
                  {i === 0 && !s.isLocked ? "무료 샘플 · " : ""}
                  {s.title}
                </span>
                {!free && (
                  <span
                    className="ml-auto text-[12px]"
                    style={{ color: "var(--sb-yuzu-light)" }}
                  >
                    🔒
                  </span>
                )}
              </div>
              {free && s.body ? (
                <ReportBodyText text={s.body} inverted />
              ) : (
                <p className="text-[12.5px] italic text-white/55 leading-relaxed">
                  결제 후 공개됩니다.
                </p>
              )}
            </div>
          </article>
        );
      })}
    </section>
  );
}

function ReportBodyText({
  text,
  compact = false,
  inverted = false,
}: {
  text: string;
  compact?: boolean;
  inverted?: boolean;
}) {
  const paragraphs = text
    .split(/\n{2,}/)
    .map((line) => line.trim())
    .filter(Boolean);

  return (
    <div
      className={compact ? "mt-1.5 flex flex-col gap-2" : "mt-3 flex flex-col gap-3"}
    >
      {paragraphs.map((paragraph, index) => (
        <p
          key={`${index}-${paragraph.slice(0, 12)}`}
          className={
            compact
              ? "text-[13px] leading-relaxed"
              : "text-[13.5px] leading-[1.82]"
          }
          style={{ color: inverted ? "rgba(255,255,255,0.9)" : "var(--sb-ink-2)" }}
        >
          {paragraph}
        </p>
      ))}
    </div>
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
      href={paidHref(qs, year, input)}
      label={`🔒 990원으로 ${year}년 전체 열기`}
      observeTargetId="yearly-detail-primary-paywall-cta"
    />
  );
}

// ============================================================
// Hero / skeleton / no-key / error / header / empty
// ============================================================

const ELEMENT_COLORS: Record<string, { bg: string; ink: string }> = {
  wood: { bg: "#D7E5BD", ink: "#3F4D2A" },
  fire: { bg: "#F7CDB7", ink: "#8B3A1F" },
  earth: { bg: "#EBD8B0", ink: "#7A5A24" },
  metal: { bg: "#E1E4E7", ink: "#465358" },
  water: { bg: "#C7D8E1", ink: "#2E4B5A" },
};

const STEM_KR: Record<string, string> = {
  甲: "갑", 乙: "을", 丙: "병", 丁: "정", 戊: "무",
  己: "기", 庚: "경", 辛: "신", 壬: "임", 癸: "계",
};

const BRANCH_KR: Record<string, string> = {
  子: "자", 丑: "축", 寅: "인", 卯: "묘", 辰: "진", 巳: "사",
  午: "오", 未: "미", 申: "신", 酉: "유", 戌: "술", 亥: "해",
};

const STEM_ELEMENT: Record<string, "wood" | "fire" | "earth" | "metal" | "water"> = {
  甲: "wood", 乙: "wood", 丙: "fire", 丁: "fire", 戊: "earth",
  己: "earth", 庚: "metal", 辛: "metal", 壬: "water", 癸: "water",
};

const BRANCH_ELEMENT: Record<string, "wood" | "fire" | "earth" | "metal" | "water"> = {
  子: "water", 丑: "earth", 寅: "wood", 卯: "wood", 辰: "earth", 巳: "fire",
  午: "fire", 未: "earth", 申: "metal", 酉: "metal", 戌: "earth", 亥: "water",
};

const BRANCH_MAIN_STEM: Record<string, string> = {
  子: "癸", 丑: "己", 寅: "甲", 卯: "乙", 辰: "戊", 巳: "丙",
  午: "丁", 未: "己", 申: "庚", 酉: "辛", 戌: "戊", 亥: "壬",
};

const MONTH_BRANCHES = ["寅", "卯", "辰", "巳", "午", "未", "申", "酉", "戌", "亥", "子", "丑"];

const BRANCH_ORDER = ["子", "丑", "寅", "卯", "辰", "巳", "午", "未", "申", "酉", "戌", "亥"];
const TWELVE_STAGE_ORDER = ["장생", "목욕", "관대", "건록", "제왕", "쇠", "병", "사", "묘", "절", "태", "양"];
const YANG_STEM_BIRTH_BRANCH: Record<string, string> = {
  甲: "亥",
  丙: "寅",
  戊: "寅",
  庚: "巳",
  壬: "申",
};
const YIN_STEM_BIRTH_BRANCH: Record<string, string> = {
  乙: "午",
  丁: "酉",
  己: "酉",
  辛: "子",
  癸: "卯",
};
const YANG_STEMS = new Set(["甲", "丙", "戊", "庚", "壬"]);

const SAMHAP_SIGNALS: Record<string, { dohwa: string; yeokma: string; hwagae: string }> = {
  寅: { dohwa: "卯", yeokma: "申", hwagae: "戌" },
  午: { dohwa: "卯", yeokma: "申", hwagae: "戌" },
  戌: { dohwa: "卯", yeokma: "申", hwagae: "戌" },
  申: { dohwa: "酉", yeokma: "寅", hwagae: "辰" },
  子: { dohwa: "酉", yeokma: "寅", hwagae: "辰" },
  辰: { dohwa: "酉", yeokma: "寅", hwagae: "辰" },
  巳: { dohwa: "午", yeokma: "亥", hwagae: "丑" },
  酉: { dohwa: "午", yeokma: "亥", hwagae: "丑" },
  丑: { dohwa: "午", yeokma: "亥", hwagae: "丑" },
  亥: { dohwa: "子", yeokma: "巳", hwagae: "未" },
  卯: { dohwa: "子", yeokma: "巳", hwagae: "未" },
  未: { dohwa: "子", yeokma: "巳", hwagae: "未" },
};

const CHUNG_PAIRS: ReadonlyArray<[string, string, string]> = [
  ["子", "午", "충"],
  ["丑", "未", "충"],
  ["寅", "申", "충"],
  ["卯", "酉", "충"],
  ["辰", "戌", "충"],
  ["巳", "亥", "충"],
];
const HAP_PAIRS: ReadonlyArray<[string, string, string]> = [
  ["子", "丑", "합"],
  ["寅", "亥", "합"],
  ["卯", "戌", "합"],
  ["辰", "酉", "합"],
  ["巳", "申", "합"],
  ["午", "未", "합"],
];
const WONJIN_PAIRS: ReadonlyArray<[string, string, string]> = [
  ["子", "未", "원진"],
  ["丑", "午", "원진"],
  ["寅", "酉", "원진"],
  ["卯", "申", "원진"],
  ["辰", "亥", "원진"],
  ["巳", "戌", "원진"],
];

function ganjiCell(hanja: string): {
  korean: string;
  element: "wood" | "fire" | "earth" | "metal" | "water";
} {
  return {
    korean: STEM_KR[hanja] ?? BRANCH_KR[hanja] ?? hanja,
    element: STEM_ELEMENT[hanja] ?? BRANCH_ELEMENT[hanja] ?? "earth",
  };
}

function tenGodLabel(dayStem: string, otherStem: string): string {
  return tenGod(dayStem, otherStem);
}

function branchTenGodLabel(dayStem: string, branch: string): string {
  return tenGod(dayStem, BRANCH_MAIN_STEM[branch] ?? branch);
}

function twelveStageFor(dayStem: string, targetBranch: string): string {
  const birthBranch = YANG_STEMS.has(dayStem)
    ? YANG_STEM_BIRTH_BRANCH[dayStem]
    : YIN_STEM_BIRTH_BRANCH[dayStem];
  const birthIndex = BRANCH_ORDER.indexOf(birthBranch ?? "");
  const targetIndex = BRANCH_ORDER.indexOf(targetBranch);
  if (birthIndex < 0 || targetIndex < 0) return "-";
  const stageIndex = YANG_STEMS.has(dayStem)
    ? (targetIndex - birthIndex + 12) % 12
    : (birthIndex - targetIndex + 12) % 12;
  return TWELVE_STAGE_ORDER[stageIndex] ?? "-";
}

function branchSinsals(dayBranch: string, targetBranch: string): string[] {
  const base = SAMHAP_SIGNALS[dayBranch];
  if (!base) return [];
  const labels: string[] = [];
  if (base.dohwa === targetBranch) labels.push("도화살");
  if (base.yeokma === targetBranch) labels.push("역마살");
  if (base.hwagae === targetBranch) labels.push("화개살");
  return labels;
}

function pairRelation(a: string, b: string, pairs: ReadonlyArray<[string, string, string]>): string | null {
  const match = pairs.find(([x, y]) => (x === a && y === b) || (x === b && y === a));
  if (!match) return null;
  return `${BRANCH_KR[match[0]]}${BRANCH_KR[match[1]]}${match[2]}`;
}

function branchRelations(natalBranches: string[], targetBranch: string): string[] {
  const out: string[] = [];
  for (const branch of natalBranches) {
    if (branch === targetBranch) continue;
    const wonjin = pairRelation(branch, targetBranch, WONJIN_PAIRS);
    const chung = pairRelation(branch, targetBranch, CHUNG_PAIRS);
    const hap = pairRelation(branch, targetBranch, HAP_PAIRS);
    if (wonjin) out.push(wonjin);
    if (chung) out.push(chung);
    if (hap) out.push(hap);
  }
  return Array.from(new Set(out)).slice(0, 3);
}

function HeroIntro({ name, item }: { name: string; item: YearlyItem }) {
  const stemC = ELEMENT_COLORS[item.stem.element];
  const branchC = ELEMENT_COLORS[item.branch.element];
  return (
    <section
      className="relative rounded-sb-xl px-5 pt-5 pb-5 overflow-hidden"
      style={{
        background: "linear-gradient(170deg, #FCE0DA 0%, #F5C2B5 100%)",
        boxShadow: "var(--shadow-sb-hero), inset 0 1px 0 rgba(255,255,255,0.5)",
      }}
    >
      <div className="text-[10.5px] font-extrabold text-sb-terra-dark tracking-wider uppercase mb-1">
        {name}님의 {item.year}년
      </div>
      <div className="flex items-center gap-3 mb-2">
        <div className="flex gap-1.5 shrink-0">
          <div
            className="w-11 h-11 rounded-md flex items-center justify-center text-[18px] font-extrabold"
            style={{ background: stemC.bg, color: stemC.ink }}
          >
            {item.stem.hanja}
          </div>
          <div
            className="w-11 h-11 rounded-md flex items-center justify-center text-[18px] font-extrabold"
            style={{ background: branchC.bg, color: branchC.ink }}
          >
            {item.branch.hanja}
          </div>
        </div>
        <div className="flex flex-col">
          <span className="text-[16px] font-extrabold text-sb-ink tracking-tight leading-tight">
            {item.stem.korean}{item.branch.korean}년
          </span>
          <span className="text-[11px] font-bold text-sb-ink-3">한국나이 {item.age + 1}세</span>
        </div>
        {item.isCurrent && (
          <span
            className="text-[9px] font-extrabold ml-auto px-2 py-1 rounded-full"
            style={{ background: "var(--sb-yuzu)", color: "var(--sb-olive-dark)" }}
          >
            올해
          </span>
        )}
      </div>
    </section>
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

function ErrorCard({ message, backHref }: { message: string; backHref: string }) {
  return (
    <div className="px-4 pt-3">
      <div
        className="bg-sb-paper rounded-sb-lg px-5 py-5"
        style={{ boxShadow: "var(--shadow-sb-card), inset 0 0 0 1px rgba(91,74,54,0.06)" }}
      >
        <h2 className="text-[15px] font-extrabold text-sb-ink mb-1.5">해설을 못 가져왔어요</h2>
        <p className="text-[13px] text-sb-ink-2 leading-relaxed mb-3">{message}</p>
        <Link
          href={backHref}
          className="inline-flex items-center gap-1.5 rounded-full bg-sb-olive text-white text-[12px] font-bold px-3.5 py-2"
        >
          연도별로 돌아가기
        </Link>
      </div>
    </div>
  );
}

function Header({ year, backHref }: { year?: number; backHref: string }) {
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
        href={backHref}
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
      <span className="text-[17px] font-extrabold text-sb-olive-dark tracking-tight">
        {year ? `📅 ${year}년 자세히` : "📅 세운"}
      </span>
      <div className="w-9" />
    </header>
  );
}

function EmptyState({ backHref }: { backHref: string }) {
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
          연도별 운세 정보가 부족해요
        </h1>
        <p className="text-[13px] text-sb-ink-2 leading-relaxed mb-5">
          생년월일·시간을 먼저 입력하면
          <br />
          연도별 운세로 바로 이어서 볼 수 있어요.
        </p>
        <Link
          href={backHref}
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

function paidHref(qs: string, year: number, input: SajuInput): string {
  const p = new URLSearchParams(qs);
  p.set("paid", "1");
  return checkoutHref({
    amount: 990,
    product: `yearly:${sajuPersonKey(input)}:${year}`,
    returnTo: `/yearly/${year}?${p.toString()}`,
    title: `${year}년 전체 해설`,
  });
}
