import Link from "next/link";
import { Fragment, Suspense } from "react";
import ContentDisclaimer from "@/app/components/ContentDisclaimer";
import ReportAccessPanel from "@/app/components/ReportAccessPanel";
import ReportGenerationLoading from "@/app/components/ReportGenerationLoading";
import ReportUtilityActions from "@/app/components/ReportUtilityActions";
import SaveLastSajuCard from "@/app/components/SaveLastSajuCard";
import BaraCardView from "@/app/components/BaraCard";
import { buildReportAccessItems } from "@/lib/auth/report-access";
import { canViewPaidContent } from "@/lib/auth/paid";
import { checkoutHref } from "@/lib/payments/checkout";
import {
  SECTIONS,
  generateOneLiner,
  generateSection,
  type SajuSectionDef,
} from "@/lib/saju/generate";
import type { SectionResult } from "@/lib/saju/generate";
import { computeChart, type ChartPillar, type SajuChart } from "@/lib/saju/chart";
import { sajuPersonKey, sajuPersonProduct } from "@/lib/saju/scope";
import { cardFromChart } from "@/lib/bara/saju-to-card";
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

export default async function ResultPage({ searchParams }: { searchParams: SearchParams }) {
  const sp = await searchParams;
  const input = parseInput(sp);
  const isPaid = input
    ? await canViewPaidContent(sp.paid === "1", {
        product: "saju",
        personKey: sajuPersonKey(input),
      })
    : false;

  return (
    <>
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
          href="/saju"
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
          다시 입력
        </Link>
        {input && (
          <span
            className="text-[11px] font-bold text-sb-terra-dark px-2.5 py-1 rounded-full bg-sb-paper"
            style={{ boxShadow: "inset 0 0 0 1px var(--sb-hairline)" }}
          >
            {input.name} · {input.calendar} {input.birthDate}
          </span>
        )}
      </header>

      <div className="flex-1 overflow-y-auto">
        {!input ? (
          <ErrorCard message="입력 정보가 부족해요. 다시 입력해 주세요." />
        ) : (
          <ResultBody input={input} isPaid={isPaid} />
        )}
      </div>
    </>
  );
}

async function ResultBody({ input, isPaid }: { input: SajuInput; isPaid: boolean }) {
  let chart: SajuChart;
  try {
    chart = await computeChart(input);
  } catch (e) {
    return <ErrorCard message={e instanceof Error ? e.message : "사주를 못 뽑았어요."} />;
  }

  const hasKey = !!process.env.OPENAI_API_KEY;

  const baraCard = cardFromChart(chart);
  const unlockHref = buildMockCheckoutHref(input);
  const accessItems = isPaid ? await buildReportAccessItems(input) : [];

  return (
    <main className="px-4 flex flex-col gap-3 pb-6">
      {baraCard && (
        <>
          <SaveLastSajuCard cardId={baraCard.id} input={input} />
          <BaraCardView
            card={baraCard}
            variant="wide"
            subjectName={input.name}
            kicker="바라의 한 줄 총평"
            bodySlot={
              hasKey ? (
                <Suspense fallback={<OneLinerInlineSkeleton />}>
                  <OneLinerInline input={input} chart={chart} />
                </Suspense>
              ) : null
            }
          />
          <ReportUtilityActions
            title={`${input.name}님의 사주바라 결과`}
            description="사주바라에서 본 사주 결과예요."
            cardImageHref={baraCard.image}
            cardDownloadName={`${input.name}-sajubara-card.png`}
          />
        </>
      )}
      <ChartCard chart={chart} />
      <ContentDisclaimer compact />
      {isPaid && <ReportAccessPanel items={accessItems} />}

      {hasKey ? (
        <Suspense
          fallback={
            <ReportGenerationLoading
              visual="saju"
              eyebrow={isPaid ? "PAID SAJU REPORT GENERATING" : "FREE REPORT GENERATING"}
              title={`${input.name}님의 사주바라 리포트를 해석하는 중이에요`}
              description="사주 4기둥과 카드 흐름을 맞춰보고, 성격·재물·관계·그림자 해설을 정리하고 있어요."
              steps={[
                "일간과 사주 4기둥 관계 확인",
                "사주바라 카드와 9개 섹션 정리",
                isPaid ? "구매한 상세 본문 생성" : "무료 해설 문장 준비",
              ]}
            />
          }
        >
          <SajuSectionsBlock
            input={input}
            chart={chart}
            isPaid={isPaid}
            unlockHref={unlockHref}
          />
        </Suspense>
      ) : (
        <SetupCard />
      )}

      <div className="h-20" />
    </main>
  );
}

function SajuSectionsBlock({
  input,
  chart,
  isPaid,
  unlockHref,
}: {
  input: SajuInput;
  chart: SajuChart;
  isPaid: boolean;
  unlockHref: string;
}) {
  return (
    <>
      {SECTIONS.map((s, i) => {
        const isFirstGated = s.gated && !SECTIONS[i - 1]?.gated;
        return (
          <Fragment key={s.key}>
            {isFirstGated && !isPaid && <LockBanner unlockHref={unlockHref} />}
            <SectionCard
              input={input}
              chart={chart}
              section={s}
              defaultOpen={i === 0}
              locked={s.gated && !isPaid}
              bodyAvailable={!s.gated || isPaid}
            />
          </Fragment>
        );
      })}
    </>
  );
}

function buildSajuResultHref(input: SajuInput, paid: boolean): string {
  const params = new URLSearchParams({
    name: input.name,
    birthDate: input.birthDate,
    birthTime: input.birthTime,
    gender: input.gender,
    calendar: input.calendar,
  });
  if (input.loveStatus) params.set("loveStatus", input.loveStatus);
  if (input.jobStatus) params.set("jobStatus", input.jobStatus);
  if (paid) params.set("paid", "1");
  return `/saju/result?${params.toString()}`;
}

function buildMockCheckoutHref(input: SajuInput): string {
  return checkoutHref({
    amount: 990,
    product: sajuPersonProduct(input),
    returnTo: buildSajuResultHref(input, true),
    title: "사주바라 전체 해설",
  });
}

async function OneLinerInline({
  input,
  chart,
}: {
  input: SajuInput;
  chart: SajuChart;
}) {
  let text: string;
  try {
    text = await generateOneLiner(input, chart);
  } catch (error) {
    console.error("[sajubara] one-liner generation failed", {
      name: input.name,
      error,
    });
    text = fallbackOneLiner(input, chart);
  }
  return (
    <p className="text-[13.5px] text-sb-ink-2 leading-relaxed whitespace-pre-wrap">
      {text}
    </p>
  );
}

function fallbackOneLiner(input: SajuInput, chart: SajuChart): string {
  const stemDetail: Record<string, string> = {
    甲: "푸른 나무",
    乙: "유연한 풀잎",
    丙: "환한 햇빛",
    丁: "작은 등불",
    戊: "큰 산",
    己: "고른 흙",
    庚: "단단한 쇠",
    辛: "섬세한 보석",
    壬: "깊은 물",
    癸: "잔잔한 비",
  };
  const image = stemDetail[chart.dayMaster.hanja] ?? "자기만의 리듬";
  return `${input.name}님은 ${image}처럼 상황을 읽고 자기 속도에 맞춰 길을 만드는 에너지를 가지고 있어요.`;
}

function OneLinerInlineSkeleton() {
  return (
    <div className="flex flex-col gap-1.5 sb-skeleton-shimmer">
      <div className="h-3 rounded-full bg-sb-cream w-full" />
      <div className="h-3 rounded-full bg-sb-cream w-[82%]" />
    </div>
  );
}

const ELEMENT_COLORS: Record<string, { bg: string; ink: string }> = {
  wood: { bg: "#D7E5BD", ink: "#3F4D2A" },
  fire: { bg: "#F7CDB7", ink: "#8B3A1F" },
  earth: { bg: "#EBD8B0", ink: "#7A5A24" },
  metal: { bg: "#E1E4E7", ink: "#465358" },
  water: { bg: "#C7D8E1", ink: "#2E4B5A" },
};

function ChartCard({ chart }: { chart: SajuChart }) {
  return (
    <section
      className="bg-sb-paper rounded-sb-lg px-3 py-4"
      style={{
        boxShadow: "var(--shadow-sb-card), inset 0 0 0 1px rgba(91,74,54,0.06)",
      }}
    >
      <header className="flex items-center justify-between px-1 mb-3">
        <h2 className="text-[14px] font-extrabold text-sb-ink tracking-tight">사주 4기둥</h2>
        <span className="text-[10px] font-semibold text-sb-ink-3">
          일간 <strong className="text-sb-olive-dark">{chart.dayMaster.korean}{chart.dayMaster.hanja}</strong>
          {chart.currentLuck && (
            <> · 대운 <strong className="text-sb-olive-dark">{chart.currentLuck.pillar}</strong></>
          )}
        </span>
      </header>
      <div className="grid grid-cols-4 gap-1.5">
        {chart.pillars.map((p) => (
          <PillarColumn
            key={p.position}
            pillar={p}
            hourUnknown={chart.hourUnknown && p.position === "시"}
          />
        ))}
      </div>
      {chart.hourUnknown && (
        <p className="text-[10px] text-sb-ink-3 px-1 mt-2">
          * 태어난 시간을 모른다고 하셨으니 시주는 참고만 봐주세요
        </p>
      )}
    </section>
  );
}

function PillarColumn({ pillar, hourUnknown }: { pillar: ChartPillar; hourUnknown: boolean }) {
  const stemC = ELEMENT_COLORS[pillar.stem.element];
  const branchC = ELEMENT_COLORS[pillar.branch.element];
  const dim = hourUnknown ? "opacity-50" : "";
  return (
    <div
      className={`flex flex-col items-center gap-1 rounded-sb-md py-2 ${dim}`}
      style={{
        background: pillar.isDayMaster ? "var(--sb-cream)" : "transparent",
        boxShadow: pillar.isDayMaster
          ? "inset 0 0 0 1.5px var(--sb-yuzu-dark)"
          : "inset 0 0 0 1px var(--sb-hairline)",
      }}
    >
      <span className="text-[10px] font-extrabold text-sb-ink-3 tracking-tight">{pillar.position}주</span>
      <span className="text-[9px] font-bold text-sb-olive">{pillar.stemTenGod}</span>
      <div
        className="w-9 h-9 rounded-md flex items-center justify-center text-[20px] font-extrabold"
        style={{ background: stemC.bg, color: stemC.ink }}
      >
        {pillar.stem.hanja}
      </div>
      <span className="text-[9.5px] text-sb-ink-2 font-semibold">{pillar.stem.korean}</span>
      <div className="w-6 border-t border-sb-hairline my-0.5" />
      <div
        className="w-9 h-9 rounded-md flex items-center justify-center text-[20px] font-extrabold"
        style={{ background: branchC.bg, color: branchC.ink }}
      >
        {pillar.branch.hanja}
      </div>
      <span className="text-[9.5px] text-sb-ink-2 font-semibold">{pillar.branch.korean}</span>
      <span className="text-[9px] font-bold text-sb-olive">{pillar.branchTenGod}</span>
    </div>
  );
}

async function SectionCard({
  input,
  chart,
  section,
  defaultOpen,
  locked,
  bodyAvailable,
}: {
  input: SajuInput;
  chart: SajuChart;
  section: SajuSectionDef;
  defaultOpen: boolean;
  locked: boolean;
  bodyAvailable: boolean;
}) {
  let result: SectionResult;
  try {
    result = await generateSection(input, chart, section, !bodyAvailable);
  } catch (error) {
    console.error("[sajubara] section generation failed", {
      section: section.key,
      name: input.name,
      error,
    });
    result = fallbackSectionResult(input, chart, section);
  }
  const isShadow = section.tone === "shadow";
  const accentBg = isShadow ? "#3F2E1F" : "var(--sb-cream)";
  const accentInk = isShadow ? "#FBE889" : "var(--sb-ink)";
  const showTeaser = locked || !result.body;

  return (
    <details
      className="bg-sb-paper rounded-sb-lg overflow-hidden"
      style={{
        boxShadow: "var(--shadow-sb-card), inset 0 0 0 1px rgba(91,74,54,0.06)",
      }}
      open={defaultOpen}
    >
      <summary className="flex items-start gap-2.5 px-4 py-3.5">
        <div
          className="w-9 h-9 rounded-sb-md flex items-center justify-center text-[20px] shrink-0"
          style={{ background: accentBg, color: accentInk }}
          aria-hidden
        >
          {section.icon}
        </div>
        <div className="flex flex-col gap-0.5 pt-0.5 flex-1 min-w-0">
          <span
            className="text-[10px] font-bold tracking-wider uppercase flex items-center gap-1"
            style={{ color: isShadow ? "var(--sb-terra-dark)" : "var(--sb-olive-light)" }}
          >
            {section.title}
            {locked && <span aria-hidden>🔒</span>}
          </span>
          <h2 className="text-[15px] font-extrabold text-sb-ink tracking-tight leading-snug">
            {result.headline}
          </h2>
        </div>
        <svg
          className="sb-chevron shrink-0 mt-1.5"
          width="14"
          height="14"
          viewBox="0 0 14 14"
          fill="none"
          aria-hidden
        >
          <path
            d="M3 5L7 9L11 5"
            stroke="var(--sb-ink-3)"
            strokeWidth="1.8"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      </summary>
      <div className="sb-accordion-body px-4 pb-4 flex flex-col gap-3">
        {showTeaser && result.teaser && (
          <p className="text-[13.5px] text-sb-ink-2 leading-relaxed whitespace-pre-wrap">
            {result.teaser}
          </p>
        )}
        {!locked && result.body && (
          <p className="text-[13.5px] text-sb-ink leading-relaxed whitespace-pre-wrap">
            {result.body}
          </p>
        )}
        {locked && (
          <p className="text-[11.5px] text-sb-ink-3 leading-relaxed italic">
            전체 해설은 잠금 해제 후 볼 수 있어요 ↑
          </p>
        )}
      </div>
    </details>
  );
}

function fallbackSectionResult(
  input: SajuInput,
  chart: SajuChart,
  section: SajuSectionDef,
): SectionResult {
  const dayPillar = chart.pillars.find((p) => p.isDayMaster);
  const monthPillar = chart.pillars.find((p) => p.position === "월");
  const stemDetail: Record<string, string> = {
    甲: "갑목",
    乙: "을목",
    丙: "병화",
    丁: "정화",
    戊: "무토",
    己: "기토",
    庚: "경금",
    辛: "신금",
    壬: "임수",
    癸: "계수",
  };
  const branchDetail: Record<string, string> = {
    子: "자수",
    丑: "축토",
    寅: "인목",
    卯: "묘목",
    辰: "진토",
    巳: "사화",
    午: "오화",
    未: "미토",
    申: "신금",
    酉: "유금",
    戌: "술토",
    亥: "해수",
  };
  const dayMaster = stemDetail[chart.dayMaster.hanja] ?? `${chart.dayMaster.korean}일간`;
  const dayBranch = dayPillar?.branch.hanja
    ? `일지 ${branchDetail[dayPillar.branch.hanja] ?? dayPillar.branch.korean}`
    : "일지";
  const monthSignal = monthPillar
    ? `${monthPillar.stemTenGod}과 ${monthPillar.branchTenGod}`
    : "월주의 흐름";
  const currentLuck = chart.currentLuck
    ? `현재 대운 ${stemDetail[chart.currentLuck.stem] ?? chart.currentLuck.stem}·${branchDetail[chart.currentLuck.branch] ?? chart.currentLuck.branch}`
    : "현재 대운";

  const fallbackByKey: Record<
    SajuSectionDef["key"],
    { headline: string; teaser: string; body: string }
  > = {
    personality: {
      headline: "기준이 분명한 생활형 감각",
      teaser: `${input.name}님은 ${dayMaster} 일간과 ${dayBranch}의 결이 함께 드러나는 사람입니다. 겉으로는 상황을 맞추지만, 중요한 선택 앞에서는 자기 기준이 먼저 섭니다.`,
      body: `${input.name}님은 ${dayMaster} 일간을 중심으로 현실 감각과 판단 기준이 비교적 선명한 편입니다. ${monthSignal}이 함께 작용해 사람을 볼 때 말보다 태도와 반복되는 행동을 더 오래 봅니다. 그래서 가까운 사람에게는 든든하지만, 기준이 흔들리는 관계에서는 쉽게 피로해질 수 있습니다. 중요한 약속은 즉답보다 하루 정도 시간을 두고 결정하는 편이 좋습니다.`,
    },
    career: {
      headline: "표현력과 실무감이 같이 뜨는 결",
      teaser: `${input.name}님은 ${dayMaster} 일간 위에 ${monthSignal}이 얹힌 구조라 일의 감을 몸으로 익히는 편입니다. 말과 결과물이 같이 보이는 환경에서 힘이 납니다.`,
      body: `${input.name}님은 ${dayMaster} 일간의 기준 위에 ${monthSignal}이 더해져, 주어진 일을 그대로 처리하기보다 자기 방식으로 정리해 성과를 내는 쪽에 가깝습니다. 반복 업무만 길어지면 집중력이 떨어질 수 있지만, 사람을 설득하거나 흐름을 구조화하는 일에서는 존재감이 살아납니다. 다만 관리·정산·보고처럼 숫자와 마감이 붙는 영역은 미루면 부담이 커집니다. 가을철에는 새 프로젝트보다 기존 업무의 기준표를 먼저 정리해두는 것이 좋습니다.`,
    },
    wealth: {
      headline: "작은 누수를 막아야 커지는 돈",
      teaser: `${input.name}님은 ${dayMaster} 일간의 현실 감각이 있지만, 돈은 들어오는 양보다 빠져나가는 경로 관리가 더 중요합니다. 지출 기준을 숫자로 세울수록 편해집니다.`,
      body: `${input.name}님은 ${dayMaster} 일간 특유의 실속 감각이 있어 돈을 허투루 쓰는 사람은 아닙니다. 다만 ${monthSignal}의 영향으로 필요한 사람과 상황에 돈을 쓰는 명분을 쉽게 만들 수 있습니다. 큰 지출보다 소액 반복 결제, 선물, 가족·지인 관련 비용에서 누수가 생기기 쉽습니다. 매월 1일에 고정비와 관계비를 따로 분리해두면 돈의 흐름이 훨씬 안정됩니다.`,
    },
    love: {
      headline: "가까울수록 확인이 필요한 관계",
      teaser: `${input.name}님은 ${dayMaster} 일간과 ${dayBranch}의 영향으로 관계에서 신뢰의 반복을 중요하게 봅니다. 말보다 꾸준한 태도가 마음을 움직입니다.`,
      body: `${input.name}님은 ${dayMaster} 일간의 결 때문에 관계에서 가벼운 말보다 실제 행동을 더 강하게 기억합니다. ${dayBranch}가 함께 놓여 있어 한 번 마음을 열면 오래 가지만, 섭섭함도 안쪽에 쌓아두기 쉽습니다. 그래서 애정에서는 다정함보다 약속을 지키는 사람이 더 잘 맞습니다. 중요한 이야기는 밤늦게 몰아서 하기보다 주말 낮처럼 감정이 덜 올라오는 시간에 나누는 편이 좋습니다.`,
    },
    year: {
      headline: "속도보다 방향을 골라야 하는 해",
      teaser: `${input.name}님에게 올해는 ${currentLuck}의 흐름 위에서 선택지가 늘어나는 시기입니다. 많이 하는 것보다 무엇을 남길지 정하는 쪽이 중요합니다.`,
      body: `${input.name}님에게 올해는 ${dayMaster} 일간의 기준을 다시 조정하는 흐름이 강합니다. ${currentLuck}이 함께 작용해 일과 관계에서 새 선택지가 보이지만, 동시에 체력과 감정 소모도 커질 수 있습니다. 무리하게 확장하면 성과보다 피로가 먼저 쌓입니다. 올해는 3개월 단위로 목표를 줄이고, 끝낼 일과 남길 일을 분리하는 방식이 좋습니다.`,
    },
    advice: {
      headline: "한 번에 바꾸기보다 작게 정리하세요",
      teaser: `${input.name}님은 ${dayMaster} 일간의 결이 있어 큰 변화보다 정리된 루틴에서 운이 살아납니다. 작은 기준을 세우면 마음도 같이 안정됩니다.`,
      body: `${input.name}님은 ${dayMaster} 일간을 중심으로 삶의 질서를 직접 만들어갈 때 힘이 나는 사람입니다. ${monthSignal}이 함께 있어 주변의 기대를 많이 의식할 수 있지만, 모든 기대를 다 받아내면 본인 리듬이 무너집니다. 지금 필요한 건 거창한 결심보다 반복 가능한 작은 정리입니다. 이번 주에는 연락, 지출, 일정 중 하나만 골라 30분 안에 정리해보세요.`,
    },
    shadow: {
      headline: "괜찮은 척하다가 늦게 지치는 패턴",
      teaser: `${input.name}님은 ${dayMaster} 일간의 기준이 단단한 만큼, 힘든 상황에서도 티를 늦게 내는 편입니다. 버티는 힘이 장점이지만 신호를 놓치면 부담이 커집니다.`,
      body: `${input.name}님은 ${dayMaster} 일간의 영향으로 쉽게 흔들리는 모습을 보이고 싶어 하지 않습니다. 여기에 ${monthSignal}이 더해지면 남에게 맡기기보다 직접 확인하고 책임지려는 쪽으로 기울 수 있습니다. 이 패턴은 신뢰를 만들지만, 피로가 쌓인 뒤에는 말이 짧아지거나 관계를 갑자기 끊고 싶어질 수 있습니다. 이번 달에는 부탁 하나를 직접 해결하지 말고 구체적으로 나눠 맡기는 연습이 필요합니다.`,
    },
    taboo: {
      headline: "급한 약속과 감정 결제를 피하세요",
      teaser: `${input.name}님은 ${currentLuck}의 흐름에서 선택이 빨라질 수 있습니다. 특히 돈과 관계가 함께 걸린 결정은 한 번 더 확인해야 합니다.`,
      body: `${input.name}님에게 올해 조심할 것은 빠른 확정입니다. ${dayMaster} 일간은 기준이 잡히면 밀고 가는 힘이 있지만, ${monthSignal}이 자극될 때는 사람의 말이나 분위기에 따라 결정을 앞당기기 쉽습니다. 특히 선결제, 공동 지출, 가까운 사람의 부탁은 나중에 부담으로 돌아올 수 있습니다. 30만원 이상 쓰는 결정은 하루 보류하고, 계약·예약은 문서로 남겨두는 편이 좋습니다.`,
    },
    badMatch: {
      headline: "말은 부드럽고 책임은 흐리는 사람",
      teaser: `${input.name}님은 ${dayMaster} 일간의 기준이 있어 신뢰를 오래 봅니다. 그래서 말은 예쁘지만 책임을 미루는 사람에게 에너지를 빼앗기기 쉽습니다.`,
      body: `${input.name}님은 ${dayMaster} 일간의 결 때문에 관계에서 약속과 태도의 일관성을 중요하게 봅니다. ${dayBranch}의 흐름도 가까운 사람을 오래 품는 쪽이라, 처음엔 이해해주다가 나중에 크게 지칠 수 있습니다. 특히 사과는 빠르지만 행동이 바뀌지 않는 사람, 부탁은 많고 책임은 나누지 않는 사람과는 거리를 둬야 합니다. 관계에서는 돈 거래보다 시간 약속을 먼저 지켜보는 것이 좋습니다.`,
    },
  };

  return fallbackByKey[section.key];
}

function LockBanner({ unlockHref }: { unlockHref: string }) {
  const lockedTitles = SECTIONS.filter((s) => s.gated).map((s) => s.title);
  return (
    <section
      className="rounded-sb-lg overflow-hidden relative"
      style={{
        background: "linear-gradient(135deg, var(--sb-olive-dark) 0%, var(--sb-olive) 100%)",
        boxShadow: "var(--shadow-sb-pop)",
      }}
    >
      <div className="absolute -top-8 -right-8 w-32 h-32 rounded-full pointer-events-none" style={{ background: "radial-gradient(circle, rgba(255,201,93,0.4) 0%, transparent 70%)" }} />
      <div className="relative px-5 py-5 flex flex-col gap-3">
        <div className="flex items-center gap-1.5">
          <span className="text-[10.5px] font-extrabold tracking-wider uppercase" style={{ color: "var(--sb-yuzu-light)" }}>
            🔒 잠금 해제
          </span>
          <span
            className="text-[9px] font-extrabold px-1.5 py-[2px] rounded-full"
            style={{ background: "var(--sb-yuzu)", color: "var(--sb-olive-dark)" }}
          >
            한 번 결제로 전부
          </span>
        </div>
        <h2 className="text-[17px] font-extrabold text-white tracking-tight leading-snug">
          남은 {lockedTitles.length}개 카드, 990원에 한번에 열기
        </h2>
        <ul className="flex flex-wrap gap-1.5">
          {lockedTitles.map((t) => (
            <li
              key={t}
              className="text-[11px] font-bold rounded-full px-2.5 py-1"
              style={{
                background: "rgba(255,255,255,0.14)",
                color: "rgba(255,255,255,0.92)",
                backdropFilter: "blur(4px)",
              }}
            >
              {t}
            </li>
          ))}
        </ul>
        <Link
          href={unlockHref}
          className="inline-flex items-center justify-center gap-1.5 rounded-full px-5 py-3 text-[14px] font-extrabold tracking-tight"
          style={{
            background:
              "linear-gradient(135deg, var(--sb-yuzu-light), var(--sb-yuzu) 60%, var(--sb-yuzu-dark))",
            color: "var(--sb-olive-dark)",
            boxShadow: "0 4px 14px rgba(216,154,42,0.5)",
          }}
        >
          990원으로 모두 열기
          <svg width="10" height="10" viewBox="0 0 10 10" fill="none" aria-hidden>
            <path
              d="M3.5 2L6.5 5L3.5 8"
              stroke="var(--sb-olive-dark)"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        </Link>
        <p className="text-[10.5px] tracking-tight text-center" style={{ color: "rgba(255,255,255,0.7)" }}>
          한 번만 결제하면 영구적으로 열람할 수 있어요
        </p>
      </div>
    </section>
  );
}

function SetupCard() {
  return (
    <section
      className="bg-sb-paper rounded-sb-lg px-4 py-4"
      style={{
        boxShadow: "var(--shadow-sb-card), inset 0 0 0 1px rgba(91,74,54,0.06)",
      }}
    >
      <header className="flex items-center gap-2 mb-2">
        <div
          className="w-9 h-9 rounded-sb-md flex items-center justify-center text-[20px]"
          style={{ background: "var(--sb-cream)" }}
          aria-hidden
        >
          🔑
        </div>
        <h2 className="text-[15px] font-extrabold text-sb-ink tracking-tight">
          OpenAI 키 한 번만 설정해 주세요
        </h2>
      </header>
      <p className="text-[13px] text-sb-ink-2 leading-relaxed mb-3">
        차트는 위에 잘 떴어요. 이제 바라가 해석을 해드리려면 OpenAI API 키 한 번만 넣어주시면 돼요.
      </p>
      <ol className="flex flex-col gap-2.5 text-[13px] text-sb-ink-2 leading-relaxed">
        <li className="flex gap-2">
          <span className="shrink-0 w-5 h-5 rounded-full bg-sb-olive text-white text-[11px] font-extrabold flex items-center justify-center">
            1
          </span>
          <span>
            <a
              href="https://platform.openai.com/api-keys"
              target="_blank"
              rel="noreferrer"
              className="font-bold text-sb-olive-dark underline"
            >
              platform.openai.com/api-keys
            </a>
            에서 키 발급 (sk- 로 시작)
          </span>
        </li>
        <li className="flex gap-2">
          <span className="shrink-0 w-5 h-5 rounded-full bg-sb-olive text-white text-[11px] font-extrabold flex items-center justify-center">
            2
          </span>
          <span>
            프로젝트 루트에 <code className="px-1.5 py-0.5 rounded bg-sb-cream text-sb-terra-dark font-mono text-[12px]">.env.local</code> 만들고 아래 한 줄 붙여넣기
          </span>
        </li>
        <li className="ml-7">
          <pre
            className="rounded-sb-md p-3 text-[12px] font-mono whitespace-pre-wrap"
            style={{
              background: "var(--sb-cream)",
              color: "var(--sb-ink)",
              boxShadow: "inset 0 0 0 1px var(--sb-hairline)",
            }}
          >
{`OPENAI_API_KEY=여기에_API_키_붙여넣기
OPENAI_MODEL=gpt-4o-mini`}
          </pre>
        </li>
        <li className="flex gap-2">
          <span className="shrink-0 w-5 h-5 rounded-full bg-sb-olive text-white text-[11px] font-extrabold flex items-center justify-center">
            3
          </span>
          <span>
            터미널에서 dev 서버 재시작 후 <span className="font-bold">새로고침</span>
          </span>
        </li>
      </ol>
      <p className="text-[11px] text-sb-ink-3 leading-relaxed mt-3">
        1건당 비용 약 <strong>2원</strong> (gpt-4o-mini 기준). 신규 가입자는 무료 크레딧 있음.
      </p>
    </section>
  );
}

function ErrorCard({ message }: { message: string }) {
  return (
    <div className="px-4">
      <div
        className="bg-sb-paper rounded-sb-lg px-5 py-5"
        style={{ boxShadow: "var(--shadow-sb-card), inset 0 0 0 1px rgba(91,74,54,0.06)" }}
      >
        <div className="text-[28px] mb-1.5">😅</div>
        <h2 className="text-[15px] font-extrabold text-sb-ink mb-1.5">바라가 잠깐 멈칫했어요</h2>
        <p className="text-[13px] text-sb-ink-2 leading-relaxed whitespace-pre-wrap">{message}</p>
        <Link
          href="/saju"
          className="inline-block mt-4 rounded-full bg-sb-olive text-white text-[13px] font-bold px-4 py-2.5"
          style={{ boxShadow: "0 2px 6px rgba(92, 110, 62, 0.3)" }}
        >
          다시 입력하기
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
  const love = loveStatus && (LOVE_STATUSES as readonly string[]).includes(loveStatus)
    ? (loveStatus as LoveStatus)
    : undefined;
  const job = jobStatus && (JOB_STATUSES as readonly string[]).includes(jobStatus)
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
