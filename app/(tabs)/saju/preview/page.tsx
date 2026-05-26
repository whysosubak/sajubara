import Link from "next/link";
import AdditionalPersonAuthBoundary from "@/app/components/AdditionalPersonAuthBoundary";
import SaveLastSajuCard from "@/app/components/SaveLastSajuCard";
import { canViewPaidContent } from "@/lib/auth/paid";
import { cardFromChart } from "@/lib/bara/saju-to-card";
import { RELATION_OPTIONS, type Relation } from "@/lib/bara/people";
import { checkoutHref } from "@/lib/payments/checkout";
import { computeChart, type ChartPillar, type SajuChart } from "@/lib/saju/chart";
import { sajuPersonKey, sajuPersonProduct } from "@/lib/saju/scope";
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
  relation?: string;
  paid?: string;
}>;

const ELEMENT_COLORS: Record<string, { bg: string; ink: string; soft: string }> = {
  wood: { bg: "#D7E5BD", ink: "#3F4D2A", soft: "rgba(215,229,189,0.48)" },
  fire: { bg: "#F7CDB7", ink: "#8B3A1F", soft: "rgba(247,205,183,0.48)" },
  earth: { bg: "#EBD8B0", ink: "#7A5A24", soft: "rgba(235,216,176,0.48)" },
  metal: { bg: "#E1E4E7", ink: "#465358", soft: "rgba(225,228,231,0.52)" },
  water: { bg: "#C7D8E1", ink: "#2E4B5A", soft: "rgba(199,216,225,0.52)" },
};

export default async function SajuPreviewPage({ searchParams }: { searchParams: SearchParams }) {
  const sp = await searchParams;
  const input = parseInput(sp);
  const relation = parseRelation(sp.relation);
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
          href={input ? `/saju?mode=add-person&${buildInputParams(input, relation)}` : "/saju?mode=add-person"}
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
          수정하기
        </Link>
        <span className="text-[15px] font-extrabold text-sb-olive-dark tracking-tight">
          만세력 미리보기
        </span>
        <Link
          href="/people"
          className="h-9 px-3 rounded-full bg-sb-paper flex items-center text-[13px] font-bold text-sb-ink-2"
          style={{ boxShadow: "inset 0 0 0 1px var(--sb-hairline)" }}
        >
          보관함
        </Link>
      </header>

      <div className="flex-1 overflow-y-auto">
        {!input ? (
          <ErrorCard message="입력 정보가 부족해요. 다시 입력해 주세요." />
        ) : (
          <AdditionalPersonAuthBoundary
            enabled={relation !== "본인"}
            nextPath={buildPreviewHref(input, relation)}
          >
            <PreviewBody input={input} relation={relation} isPaid={isPaid} />
          </AdditionalPersonAuthBoundary>
        )}
      </div>
    </>
  );
}

async function PreviewBody({
  input,
  relation,
  isPaid,
}: {
  input: SajuInput;
  relation: Relation;
  isPaid: boolean;
}) {
  let chart: SajuChart;
  try {
    chart = await computeChart(input);
  } catch (e) {
    return <ErrorCard message={e instanceof Error ? e.message : "사주를 못 뽑았어요."} />;
  }

  const card = cardFromChart(chart);
  const resultHref = buildResultHref(input, true);
  const checkoutHref = buildMockCheckoutHref(input);

  return (
    <main className="px-4 pt-4 pb-28 flex flex-col gap-3">
      {card && <SaveLastSajuCard cardId={card.id} input={input} relation={relation} />}

      <section
        className="rounded-sb-xl overflow-hidden px-5 py-5"
        style={{
          background: "linear-gradient(150deg, #FFF4D4 0%, #F4E0B7 54%, #E6C987 100%)",
          boxShadow: "var(--shadow-sb-pop), inset 0 1px 0 rgba(255,255,255,0.52)",
        }}
      >
        <div className="text-[11px] font-extrabold tracking-wider uppercase text-sb-terra-dark mb-2">
          저장 완료
        </div>
        <h1 className="text-[22px] font-extrabold text-sb-ink tracking-tight leading-snug">
          {input.name}님의 만세력을
          <br />
          먼저 확인했어요
        </h1>
        <p className="mt-3 text-[13.5px] text-sb-ink-2 leading-relaxed">
          다른 사람 사주는 해석 본문을 바로 생성하지 않고, 만세력까지만 무료로 보여드려요.
          성격·관계·재물·올해 흐름은 990원 결제 후 열립니다.
        </p>
      </section>

      <InputSummary input={input} relation={relation} />
      <PreviewChart chart={chart} />

      <section
        className="rounded-sb-xl px-5 py-5"
        style={{
          background: "linear-gradient(135deg, var(--sb-olive-dark), var(--sb-olive))",
          boxShadow: "var(--shadow-sb-pop)",
        }}
      >
        <div className="flex items-center gap-1.5 mb-2">
          <span className="text-[10.5px] font-extrabold tracking-wider uppercase text-sb-yuzu-light">
            🔒 해석 잠금
          </span>
          <span
            className="text-[9px] font-extrabold px-1.5 py-[2px] rounded-full"
            style={{ background: "var(--sb-yuzu)", color: "var(--sb-olive-dark)" }}
          >
            다른 사람 사주
          </span>
        </div>
        <h2 className="text-[17px] font-extrabold text-white tracking-tight leading-snug">
          {input.name}님의 사주바라 전체 해설
        </h2>
        <ul className="mt-3 flex flex-wrap gap-1.5">
          {["타고난 성격", "직업·재능", "재물운", "애정·관계", "올해 흐름"].map((label) => (
            <li
              key={label}
              className="text-[11px] font-bold rounded-full px-2.5 py-1"
              style={{
                background: "rgba(255,255,255,0.14)",
                color: "rgba(255,255,255,0.92)",
              }}
            >
              {label}
            </li>
          ))}
        </ul>
        <Link
          href={isPaid ? resultHref : checkoutHref}
          className="mt-4 w-full rounded-full py-3.5 text-[15px] font-extrabold tracking-tight flex items-center justify-center gap-1.5"
          style={{
            background:
              "linear-gradient(135deg, var(--sb-yuzu-light), var(--sb-yuzu) 62%, var(--sb-yuzu-dark))",
            color: "var(--sb-olive-dark)",
            boxShadow: "var(--shadow-sb-pop), inset 0 1px 0 rgba(255,255,255,0.38)",
          }}
        >
          {isPaid ? "해석 보러가기" : `990원으로 ${input.name}님 해석 열기`}
          <svg width="12" height="12" viewBox="0 0 12 12" fill="none" aria-hidden>
            <path
              d="M4.5 2.5L7.8 6L4.5 9.5"
              stroke="var(--sb-olive-dark)"
              strokeWidth="1.9"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        </Link>
        <p className="text-center text-[11px] mt-3" style={{ color: "rgba(255,255,255,0.68)" }}>
          테스트 결제에서는 실제 돈이 결제되지 않아요.
        </p>
      </section>
    </main>
  );
}

function InputSummary({ input, relation }: { input: SajuInput; relation: Relation }) {
  const rows = [
    ["이름", input.name],
    ["관계", relation],
    ["생년월일", `${input.birthDate} (${input.calendar})`],
    ["태어난 시간", input.birthTime],
    ["성별", input.gender],
  ];
  return (
    <section
      className="bg-sb-paper rounded-sb-lg px-4 py-4"
      style={{ boxShadow: "var(--shadow-sb-card), inset 0 0 0 1px rgba(91,74,54,0.06)" }}
    >
      <h2 className="text-[14px] font-extrabold text-sb-ink tracking-tight mb-3">
        입력하신 내용
      </h2>
      <dl className="flex flex-col gap-2.5">
        {rows.map(([label, value]) => (
          <div key={label} className="flex items-center justify-between gap-3">
            <dt className="text-[12px] font-bold text-sb-ink-3">{label}</dt>
            <dd className="text-[13.5px] font-extrabold text-sb-ink text-right">{value}</dd>
          </div>
        ))}
      </dl>
    </section>
  );
}

function PreviewChart({ chart }: { chart: SajuChart }) {
  return (
    <section
      className="rounded-sb-xl overflow-hidden bg-sb-paper"
      style={{ boxShadow: "var(--shadow-sb-card), inset 0 0 0 1px rgba(91,74,54,0.06)" }}
    >
      <header
        className="px-4 py-3 text-center"
        style={{ background: "linear-gradient(135deg, #79BBB7, #5AA9B3)" }}
      >
        <h2 className="text-[17px] font-extrabold text-white tracking-tight">내 만세력</h2>
        <p className="text-[11px] font-semibold text-white/75 mt-1">
          해석 본문 생성 전, 사주의 뼈대만 먼저 보여드려요
        </p>
      </header>

      <div className="px-3 py-3">
        <div className="grid grid-cols-4 gap-1.5">
          {chart.pillars.map((p) => (
            <PillarPreview
              key={p.position}
              pillar={p}
              hourUnknown={chart.hourUnknown && p.position === "시"}
            />
          ))}
        </div>
        <div className="mt-3 flex flex-wrap gap-1.5">
          <Tag>일간 {chart.dayMaster.korean}{chart.dayMaster.hanja}</Tag>
          {chart.currentLuck && <Tag>현재 대운 {chart.currentLuck.pillar}</Tag>}
          {chart.hourUnknown && <Tag>시주 참고용</Tag>}
        </div>
      </div>
    </section>
  );
}

function PillarPreview({ pillar, hourUnknown }: { pillar: ChartPillar; hourUnknown: boolean }) {
  const stemC = ELEMENT_COLORS[pillar.stem.element];
  const branchC = ELEMENT_COLORS[pillar.branch.element];
  return (
    <div
      className={`rounded-sb-md overflow-hidden ${hourUnknown ? "opacity-50" : ""}`}
      style={{
        background: pillar.isDayMaster ? "rgba(255,235,160,0.26)" : "rgba(255,255,255,0.62)",
        boxShadow: pillar.isDayMaster
          ? "inset 0 0 0 1.5px var(--sb-yuzu-dark)"
          : "inset 0 0 0 1px var(--sb-hairline)",
      }}
    >
      <div className="text-center py-2">
        <div className="text-[10px] font-extrabold text-sb-ink-3">{pillar.position}주</div>
        <div className="mt-1 text-[9px] font-bold text-sb-olive">{pillar.stemTenGod}</div>
      </div>
      <div
        className="mx-2 rounded-[12px] h-12 flex flex-col items-center justify-center"
        style={{ background: stemC.soft, color: stemC.ink }}
      >
        <span className="text-[24px] leading-none font-extrabold">{pillar.stem.hanja}</span>
        <span className="text-[10px] font-bold mt-0.5">{pillar.stem.korean}</span>
      </div>
      <div
        className="mx-2 mt-1.5 mb-2 rounded-[12px] h-12 flex flex-col items-center justify-center"
        style={{ background: branchC.soft, color: branchC.ink }}
      >
        <span className="text-[24px] leading-none font-extrabold">{pillar.branch.hanja}</span>
        <span className="text-[10px] font-bold mt-0.5">{pillar.branch.korean}</span>
      </div>
      <div className="text-center pb-2 text-[9px] font-bold text-sb-olive">
        {pillar.branchTenGod}
      </div>
    </div>
  );
}

function Tag({ children }: { children: React.ReactNode }) {
  return (
    <span
      className="text-[10.5px] font-extrabold px-2.5 py-1 rounded-full text-sb-ink-2"
      style={{ background: "var(--sb-cream)" }}
    >
      {children}
    </span>
  );
}

function ErrorCard({ message }: { message: string }) {
  return (
    <main className="px-4 pt-4">
      <section
        className="bg-sb-paper rounded-sb-lg px-5 py-7 text-center"
        style={{ boxShadow: "var(--shadow-sb-card), inset 0 0 0 1px rgba(91,74,54,0.06)" }}
      >
        <h1 className="text-[16px] font-extrabold text-sb-ink mb-2">미리보기를 만들 수 없어요</h1>
        <p className="text-[13px] text-sb-ink-2 leading-relaxed">{message}</p>
        <Link
          href="/saju?mode=add-person"
          className="mt-4 inline-flex rounded-full bg-sb-olive text-white text-[13px] font-bold px-4 py-2.5"
        >
          다시 입력하기
        </Link>
      </section>
    </main>
  );
}

function buildInputParams(input: SajuInput, relation?: Relation): string {
  const params = new URLSearchParams({
    name: input.name,
    birthDate: input.birthDate,
    birthTime: input.birthTime,
    gender: input.gender,
    calendar: input.calendar,
  });
  if (relation) params.set("relation", relation);
  if (input.loveStatus) params.set("loveStatus", input.loveStatus);
  if (input.jobStatus) params.set("jobStatus", input.jobStatus);
  return params.toString();
}

function buildResultHref(input: SajuInput, paid: boolean): string {
  const params = new URLSearchParams(buildInputParams(input));
  if (paid) params.set("paid", "1");
  return `/saju/result?${params.toString()}`;
}

function buildPreviewHref(input: SajuInput, relation: Relation): string {
  return `/saju/preview?${buildInputParams(input, relation)}`;
}

function buildMockCheckoutHref(input: SajuInput): string {
  return checkoutHref({
    amount: 990,
    product: sajuPersonProduct(input),
    returnTo: buildResultHref(input, true),
    title: `${input.name}님 사주바라 전체 해설`,
  });
}

function parseRelation(value: string | undefined): Relation {
  return value && (RELATION_OPTIONS as readonly string[]).includes(value)
    ? (value as Relation)
    : "가족";
}

function parseInput(sp: Awaited<SearchParams>): SajuInput | null {
  if (!sp.name || !sp.birthDate) return null;
  const gender = sp.gender === "남" || sp.gender === "여" ? sp.gender : "여";
  const calendar = sp.calendar === "음력" ? "음력" : "양력";
  const loveStatus =
    sp.loveStatus && (LOVE_STATUSES as readonly string[]).includes(sp.loveStatus)
      ? (sp.loveStatus as LoveStatus)
      : undefined;
  const jobStatus =
    sp.jobStatus && (JOB_STATUSES as readonly string[]).includes(sp.jobStatus)
      ? (sp.jobStatus as JobStatus)
      : undefined;
  return {
    name: sp.name,
    birthDate: sp.birthDate,
    birthTime: sp.birthTime ?? "모름",
    gender: gender as Gender,
    calendar: calendar as CalendarType,
    ...(loveStatus ? { loveStatus } : {}),
    ...(jobStatus ? { jobStatus } : {}),
  };
}
