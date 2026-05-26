import Link from "next/link";
import type { ReactNode } from "react";
import PrintDocumentActions from "@/app/components/PrintDocumentActions";
import { canViewPaidContent } from "@/lib/auth/paid";
import { computeChart, type SajuChart, type YearlyItem } from "@/lib/saju/chart";
import {
  YEAR_FORTUNE_META,
  YEAR_FORTUNE_ORDER,
  generateYearDetail,
  type YearDetail,
  type YearMonth,
  type YearSecret,
} from "@/lib/saju/generate";
import { sajuPersonKey } from "@/lib/saju/scope";
import { computeKeySignals } from "@/lib/saju/signals";
import type {
  CalendarType,
  Gender,
  JobStatus,
  LoveStatus,
  SajuInput,
} from "@/lib/saju/types";
import { JOB_STATUSES, LOVE_STATUSES } from "@/lib/saju/types";

export const dynamic = "force-dynamic";

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

export default async function YearlyPrintPage({
  params,
  searchParams,
}: {
  params: RouteParams;
  searchParams: SearchParams;
}) {
  const { year: yearStr } = await params;
  const year = Number.parseInt(yearStr, 10);
  const sp = await searchParams;
  const input = parseInput(sp);
  const qs = inputToQs(sp);
  const returnHref = input && Number.isFinite(year) ? `/yearly/${year}?${qs}` : "/yearly";

  if (!input || !Number.isFinite(year)) {
    return (
      <PrintShell pdfTitle="사주바라 - 연도별 운세" returnHref={returnHref}>
        <EmptyDocument />
      </PrintShell>
    );
  }

  const isPaid = await canViewPaidContent(sp.paid === "1", {
    product: "yearly",
    year,
    personKey: sajuPersonKey(input),
  });
  const paidQs = inputToQs(sp, isPaid);
  const paidReturnHref = `/yearly/${year}?${paidQs}`;
  const pdfTitle = buildReportPdfTitle(`${input.name}님의 ${year}년 연도별 운세`);

  let chart: SajuChart;
  try {
    chart = await computeChart(input);
  } catch (error) {
    return (
      <PrintShell pdfTitle={pdfTitle} returnHref={paidReturnHref}>
        <ErrorDocument
          title="만세력을 불러오지 못했어요"
          message={error instanceof Error ? error.message : "입력값을 다시 확인해 주세요."}
        />
      </PrintShell>
    );
  }

  const target = chart.yearlyList.find((item) => item.year === year);
  if (!target) {
    return (
      <PrintShell pdfTitle={pdfTitle} returnHref={paidReturnHref}>
        <ErrorDocument
          title={`${year}년 운세 범위를 찾지 못했어요`}
          message="연도별 운세 화면에서 다시 진입해 주세요."
        />
      </PrintShell>
    );
  }

  if (!process.env.OPENAI_API_KEY) {
    return (
      <PrintShell pdfTitle={pdfTitle} returnHref={paidReturnHref}>
        <ErrorDocument
          title="AI 해설 설정이 필요해요"
          message="OPENAI_API_KEY 설정 후 문서형 리포트를 만들 수 있어요."
        />
      </PrintShell>
    );
  }

  let detail: YearDetail;
  try {
    detail = await generateYearDetail(input, chart, year, !isPaid);
  } catch (error) {
    return (
      <PrintShell pdfTitle={pdfTitle} returnHref={paidReturnHref}>
        <ErrorDocument
          title="해설을 불러오지 못했어요"
          message={error instanceof Error ? error.message : "잠시 후 다시 시도해 주세요."}
        />
      </PrintShell>
    );
  }

  return (
    <PrintShell pdfTitle={pdfTitle} returnHref={paidReturnHref}>
      <YearlyDocument input={input} chart={chart} target={target} detail={detail} isPaid={isPaid} />
    </PrintShell>
  );
}

function PrintShell({
  pdfTitle,
  returnHref,
  children,
}: {
  pdfTitle: string;
  returnHref: string;
  children: ReactNode;
}) {
  return (
    <main className="h-dvh overflow-y-auto bg-[#F7F1DF] text-[#2A1F14]">
      <PrintDocumentActions pdfTitle={pdfTitle} returnHref={returnHref} />
      <div className="print-page mx-auto max-w-[760px] bg-[#FFFDF7] px-8 py-9 shadow-[0_12px_40px_rgba(60,40,20,0.12)]">
        {children}
      </div>
      <style>{`
        html, body {
          height: auto !important;
          overflow: auto !important;
          background: #F7F1DF !important;
        }
        .print-page {
          min-height: 100vh;
        }
        .doc-section,
        .doc-card {
          break-inside: avoid;
          page-break-inside: avoid;
        }
        @media print {
          @page {
            size: A4;
            margin: 14mm;
          }
          html, body {
            height: auto !important;
            overflow: visible !important;
            background: #fff !important;
          }
          body {
            -webkit-print-color-adjust: exact;
            print-color-adjust: exact;
          }
          .print-hidden {
            display: none !important;
          }
          .print-page {
            max-width: none !important;
            min-height: 0 !important;
            padding: 0 !important;
            box-shadow: none !important;
            background: #fff !important;
          }
          a {
            color: inherit;
            text-decoration: none;
          }
          p {
            orphans: 3;
            widows: 3;
          }
        }
      `}</style>
    </main>
  );
}

function YearlyDocument({
  input,
  chart,
  target,
  detail,
  isPaid,
}: {
  input: SajuInput;
  chart: SajuChart;
  target: YearlyItem;
  detail: YearDetail;
  isPaid: boolean;
}) {
  const signals = computeKeySignals(chart).slice(0, 8);
  return (
    <article>
      <header className="border-b border-[#E7DCC3] pb-7">
        <div className="mb-3 text-[12px] font-black tracking-[0.22em] text-[#5C6E3E]">
          SAJUBARA REPORT
        </div>
        <h1 className="text-[32px] font-black leading-tight tracking-tight text-[#2A1F14]">
          {input.name}님의 {target.year}년 연도별 운세
        </h1>
        <p className="mt-3 text-[14px] font-bold leading-relaxed text-[#6E5C42]">
          {target.stem.hanja}
          {target.branch.hanja} {target.stem.korean}
          {target.branch.korean}년 · 한국나이 {target.age + 1}세 · {input.calendar}{" "}
          {input.birthDate} · {input.birthTime}
        </p>
        <div className="mt-5 grid grid-cols-2 gap-2 text-[12px] font-bold text-[#5B4A36] sm:grid-cols-4">
          <MetaPill label="성별" value={input.gender} />
          <MetaPill label="연애" value={input.loveStatus ?? "미선택"} />
          <MetaPill label="일" value={input.jobStatus ?? "미선택"} />
          <MetaPill label="상태" value={isPaid ? "전체 해설" : "무료 샘플"} />
        </div>
      </header>

      <DocumentSection eyebrow="OVERVIEW" title="한 해 총평">
        <h2 className="text-[22px] font-black leading-snug text-[#2A1F14]">{detail.headline}</h2>
        <BodyText text={detail.overview} />
      </DocumentSection>

      <DocumentSection eyebrow="MANSERYEOK" title="해석 근거">
        <div className="grid grid-cols-4 gap-2">
          {chart.pillars.map((pillar) => (
            <div
              key={pillar.position}
              className="doc-card rounded-[16px] border border-[#E5D8BE] bg-white px-3 py-3 text-center"
            >
              <div className="text-[11px] font-black text-[#8B7758]">{pillar.position}주</div>
              <div className="mt-2 text-[24px] font-black text-[#2A1F14]">
                {pillar.stem.hanja}
                {pillar.branch.hanja}
              </div>
              <div className="mt-1 text-[11px] font-bold leading-snug text-[#6E5C42]">
                {pillar.stemTenGod} · {pillar.branchTenGod}
              </div>
              {pillar.isDayMaster && (
                <div className="mt-2 rounded-full bg-[#F4C95D] px-2 py-1 text-[9px] font-black text-[#3F4D2A]">
                  일간
                </div>
              )}
            </div>
          ))}
        </div>
        {signals.length > 0 && (
          <div className="mt-4 flex flex-wrap gap-1.5">
            {signals.map((signal) => (
              <span
                key={signal}
                className="rounded-full bg-[#F4F0E5] px-2.5 py-1 text-[11px] font-extrabold text-[#5B4A36]"
              >
                {signal}
              </span>
            ))}
          </div>
        )}
      </DocumentSection>

      <DocumentSection eyebrow="MONTHLY FLOW" title="12개월 흐름">
        <div className="flex flex-col gap-4">
          {detail.months.map((month) => (
            <MonthDocumentCard key={month.month} month={month} isPaid={isPaid} />
          ))}
        </div>
      </DocumentSection>

      <DocumentSection eyebrow="SIX THEMES" title="6대 운세">
        <div className="flex flex-col gap-4">
          {YEAR_FORTUNE_ORDER.map((key) => {
            const fortune = detail.fortunes.find((item) => item.key === key);
            if (!fortune) return null;
            const meta = YEAR_FORTUNE_META[key];
            return (
              <section
                key={key}
                className="doc-card rounded-[18px] border border-[#E5D8BE] bg-white px-5 py-4"
              >
                <div className="text-[12px] font-black tracking-wider text-[#5C6E3E]">
                  {meta.emoji} {meta.title}
                </div>
                <h3 className="mt-1 text-[18px] font-black leading-snug text-[#2A1F14]">
                  {fortune.subtitle}
                </h3>
                {isPaid ? (
                  <BodyText text={fortune.body} />
                ) : (
                  <LockedText text={fortune.bodyTeaser} />
                )}
              </section>
            );
          })}
        </div>
      </DocumentSection>

      <DocumentSection eyebrow="SECRET SOLUTION" title="시크릿 솔루션">
        <div className="flex flex-col gap-4">
          {detail.secret.map((secret, index) => (
            <SecretDocumentCard
              key={`${secret.title}-${index}`}
              item={secret}
              index={index}
              isPaid={isPaid}
            />
          ))}
        </div>
      </DocumentSection>

      <footer className="mt-10 border-t border-[#E7DCC3] pt-5 text-[11px] leading-relaxed text-[#8B7758]">
        사주바라 리포트는 사주 명식과 현재 입력 정보를 바탕으로 생성된 참고용 운세 콘텐츠입니다.
        중요한 의사결정은 현실 조건과 전문가 조언을 함께 확인해 주세요.
      </footer>
    </article>
  );
}

function DocumentSection({
  eyebrow,
  title,
  children,
}: {
  eyebrow: string;
  title: string;
  children: ReactNode;
}) {
  return (
    <section className="doc-section mt-8">
      <div className="mb-3 flex items-end justify-between gap-3 border-b border-[#E7DCC3] pb-2">
        <div>
          <div className="text-[10px] font-black tracking-[0.2em] text-[#8B7758]">{eyebrow}</div>
          <h2 className="mt-1 text-[20px] font-black tracking-tight text-[#2A1F14]">{title}</h2>
        </div>
      </div>
      {children}
    </section>
  );
}

function MonthDocumentCard({ month, isPaid }: { month: YearMonth; isPaid: boolean }) {
  const unlocked = isPaid || month.isSampleFree;
  return (
    <section className="doc-card rounded-[18px] border border-[#E5D8BE] bg-white px-5 py-4">
      <div className="flex items-start gap-3">
        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-[#F4F0E5] text-[13px] font-black text-[#5C6E3E]">
          {month.month}월
        </div>
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2">
            <h3 className="text-[18px] font-black leading-snug text-[#2A1F14]">
              {month.subtitle}
            </h3>
            {!unlocked && <span className="text-[12px] font-black text-[#8B5E3C]">잠금</span>}
          </div>
          {unlocked ? <BodyText text={month.body} /> : <LockedText text={month.bodyTeaser} />}
        </div>
      </div>
    </section>
  );
}

function SecretDocumentCard({
  item,
  index,
  isPaid,
}: {
  item: YearSecret;
  index: number;
  isPaid: boolean;
}) {
  const unlocked = isPaid || !item.isLocked;
  return (
    <section className="doc-card rounded-[18px] border border-[#E5D8BE] bg-white px-5 py-4">
      <div className="text-[12px] font-black tracking-wider text-[#8B5E3C]">
        {item.emoji} {index === 0 && !item.isLocked ? "무료 샘플 · " : ""}
        {item.title}
      </div>
      {unlocked ? <BodyText text={item.body} /> : <LockedText text="결제 후 공개됩니다." />}
    </section>
  );
}

function BodyText({ text }: { text: string }) {
  const paragraphs = text
    .split(/\n{2,}/)
    .map((line) => line.trim())
    .filter(Boolean);

  if (paragraphs.length === 0) {
    return <p className="mt-3 text-[14px] leading-[1.85] text-[#6E5C42]">본문을 준비 중입니다.</p>;
  }

  return (
    <div className="mt-3 flex flex-col gap-3">
      {paragraphs.map((paragraph, index) => (
        <p key={`${index}-${paragraph.slice(0, 14)}`} className="text-[14px] leading-[1.9] text-[#4E4231]">
          {paragraph}
        </p>
      ))}
    </div>
  );
}

function LockedText({ text }: { text: string }) {
  return (
    <div className="mt-3 rounded-[14px] border border-dashed border-[#D7C8AA] bg-[#FBF7EC] px-4 py-3">
      <p className="text-[13px] leading-[1.75] text-[#8B7758]">
        {text || "전체 문서에는 결제 후 생성된 상세 본문이 들어갑니다."}
      </p>
    </div>
  );
}

function MetaPill({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-full bg-[#F4F0E5] px-3 py-2">
      <span className="text-[#8B7758]">{label}</span>
      <span className="ml-2 text-[#2A1F14]">{value}</span>
    </div>
  );
}

function EmptyDocument() {
  return (
    <ErrorDocument
      title="연도별 운세 정보가 부족해요"
      message="생년월일과 연도를 포함한 리포트 화면에서 다시 PDF 저장을 눌러 주세요."
    />
  );
}

function ErrorDocument({ title, message }: { title: string; message: string }) {
  return (
    <section className="rounded-[24px] border border-[#E5D8BE] bg-white px-6 py-8">
      <h1 className="text-[24px] font-black text-[#2A1F14]">{title}</h1>
      <p className="mt-3 text-[14px] leading-relaxed text-[#5B4A36]">{message}</p>
      <Link
        href="/yearly"
        className="print-hidden mt-5 inline-flex rounded-full bg-[#5C6E3E] px-4 py-2 text-[13px] font-extrabold text-white"
      >
        연도별 운세로 돌아가기
      </Link>
    </section>
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

function inputToQs(sp: Awaited<SearchParams>, paid?: boolean): string {
  const obj: Record<string, string> = {};
  if (sp.name) obj.name = sp.name;
  if (sp.birthDate) obj.birthDate = sp.birthDate;
  if (sp.birthTime) obj.birthTime = sp.birthTime;
  if (sp.gender) obj.gender = sp.gender;
  if (sp.calendar) obj.calendar = sp.calendar;
  if (sp.loveStatus) obj.loveStatus = sp.loveStatus;
  if (sp.jobStatus) obj.jobStatus = sp.jobStatus;
  if (paid) obj.paid = "1";
  return new URLSearchParams(obj).toString();
}

function buildReportPdfTitle(title: string): string {
  const cleaned = title.replace(/[\\/:*?"<>|]+/g, "-").replace(/\s+/g, " ").trim();
  const match = cleaned.match(/^(.+?)님의\s*(.+)$/);
  if (!match) return sanitizeFileName(`사주바라 - ${cleaned}`);
  const [, name, reportTitle] = match;
  return sanitizeFileName(`사주바라 - ${name.trim()} - ${reportTitle.trim()}`);
}

function sanitizeFileName(value: string): string {
  return value.replace(/[\\/:*?"<>|]+/g, "-").replace(/\s+/g, " ").trim();
}
