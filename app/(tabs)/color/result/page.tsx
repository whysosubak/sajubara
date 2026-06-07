import Link from "next/link";
import { getLunarDate } from "@gracefullight/saju";
import ContentDisclaimer from "@/app/components/ContentDisclaimer";
import SaveColorBaraResult from "@/app/components/SaveColorBaraResult";
import {
  analyzeColorNumerology,
  type ColorNumerologyReport,
} from "@/lib/color/numerology";

type SearchParams = Promise<{
  name?: string;
  month?: string;
  day?: string;
  calendar?: string;
  solarDate?: string;
}>;

export default async function ColorBaraResultPage({
  searchParams,
}: {
  searchParams: SearchParams;
}) {
  const sp = await searchParams;
  const isSolar = sp.calendar === "solar";
  const converted = getAnalysisDate(sp);

  let report: ColorNumerologyReport | null = null;
  let error: string | null = null;
  try {
    if (!converted) throw new Error("생일 정보를 다시 확인해 주세요.");
    report = analyzeColorNumerology({
      name: sp.name,
      lunarMonth: converted.lunarMonth,
      lunarDay: converted.lunarDay,
    });
  } catch (e) {
    error = e instanceof Error ? e.message : "생일 정보를 다시 확인해 주세요.";
  }

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
          href="/color"
          className="h-9 px-3 rounded-full bg-sb-paper flex items-center gap-1.5 text-[13px] font-bold text-sb-ink-2"
          style={{ boxShadow: "inset 0 0 0 1px var(--sb-hairline)" }}
        >
          <BackIcon />
          다시 입력
        </Link>
        <span className="text-[15px] font-extrabold text-sb-olive-dark tracking-tight">
          컬러바라 결과
        </span>
        <div className="w-[74px]" />
      </header>

      <div className="flex-1 overflow-y-auto">
        {!report || error ? (
          <ErrorCard message={error ?? "결과를 만들 수 없어요."} />
        ) : (
          <main className="px-4 pt-4 pb-8 flex flex-col gap-3">
            {converted && (
              <SaveColorBaraResult
                name={sp.name}
                calendar={isSolar ? "solar" : "lunar"}
                solarDate={isSolar ? sp.solarDate : undefined}
                lunarMonth={converted.lunarMonth}
                lunarDay={converted.lunarDay}
                sourceLabel={converted.sourceLabel}
                lunarLabel={converted.lunarLabel}
                report={report}
              />
            )}
            <Hero
              report={report}
              isSolar={isSolar}
              sourceLabel={converted?.sourceLabel ?? ""}
              lunarLabel={converted?.lunarLabel ?? ""}
            />
            <ContentDisclaimer compact />
            <CodeCard
              index="1"
              title="당신의 타고난 소울 DNA"
              eyebrow="본질"
              color={report.soul.hex}
              main={`${report.soul.season}의 기운, ${report.soul.colorKr} 에너지`}
              body={report.soul.description}
              note={report.soul.caution}
            />
            <CodeCard
              index="2"
              title="당신이 활약할 인생 무대"
              eyebrow="환경"
              color={report.stage.hex}
              main={`낙서 ${report.stage.number}번 방 · ${report.stage.keyword}`}
              body={report.stage.description}
              note={report.stage.caution}
            />
            <CodeCard
              index="3"
              title="핵심 컬러 활용법"
              eyebrow="반복되는 인생 패턴"
              color={report.cheat.hex}
              main={`${report.cheat.number}번 · ${report.cheat.colorKr} · ${report.cheat.keyword}`}
              body={report.cheat.description}
              note="이 흐름은 좋고 나쁨보다, 인생에서 반복적으로 켜지는 핵심 스위치에 가까워요."
              featured
            />
            <PersonaCard report={report} />
            <TherapyCard report={report} />
            <CrossSell />
          </main>
        )}
      </div>
    </>
  );
}

function Hero({
  report,
  isSolar,
  sourceLabel,
  lunarLabel,
}: {
  report: ColorNumerologyReport;
  isSolar: boolean;
  sourceLabel: string;
  lunarLabel: string;
}) {
  return (
    <section
      className="relative overflow-hidden rounded-sb-xl px-5 pt-6 pb-5"
      style={{
        background:
          `radial-gradient(circle at 80% 20%, ${report.cheat.hex}80, transparent 34%), radial-gradient(circle at 18% 78%, ${report.soul.hex}68, transparent 32%), linear-gradient(145deg, #FFF8E8 0%, #F1E5C8 100%)`,
        boxShadow: "var(--shadow-sb-hero), inset 0 1px 0 rgba(255,255,255,0.58)",
      }}
    >
      <div className="text-[10.5px] font-extrabold tracking-[0.16em] uppercase text-sb-olive-light mb-2">
        다성샘의 컬러수비학
      </div>
      <h1 className="text-[25px] font-extrabold text-sb-ink leading-tight tracking-tight">
        {report.headline}
      </h1>
      <p className="mt-3 text-[13px] font-semibold text-sb-ink-2 leading-relaxed">
        {isSolar && sourceLabel
          ? `${sourceLabel}을 ${lunarLabel}로 변환해 소울 컬러, 인생 무대, 핵심 컬러를 계산했어요.`
          : `${lunarLabel}의 숫자로 소울 컬러, 인생 무대, 핵심 컬러를 계산했어요.`}
      </p>
      {isSolar && (
        <div
          className="mt-4 rounded-sb-md px-3 py-2.5 text-[12px] font-semibold leading-relaxed text-sb-terra-dark"
          style={{ background: "rgba(255,230,168,0.76)", boxShadow: "inset 0 0 0 1px rgba(184,122,91,0.22)" }}
        >
          양력 생일은 자동으로 음력 월/일로 변환했습니다. 윤달 여부가 있는 경우 결과에 함께 반영됩니다.
        </div>
      )}
      <div className="mt-5 grid grid-cols-3 gap-2">
        <ColorChip label="소울" value={report.soul.colorKr} color={report.soul.hex} />
        <ColorChip label="무대" value={report.stage.colorKr} color={report.stage.hex} />
        <ColorChip label="핵심" value={report.cheat.colorKr} color={report.cheat.hex} />
      </div>
    </section>
  );
}

function ColorChip({ label, value, color }: { label: string; value: string; color: string }) {
  return (
    <div
      className="rounded-sb-md px-3 py-2.5"
      style={{
        background: "rgba(255,253,245,0.72)",
        boxShadow: "inset 0 0 0 1px rgba(91,74,54,0.08)",
      }}
    >
      <div className="mb-1 h-2.5 w-2.5 rounded-full" style={{ background: color }} />
      <div className="text-[10px] font-extrabold text-sb-ink-3">{label}</div>
      <div className="mt-0.5 text-[12px] font-extrabold text-sb-ink">{value}</div>
    </div>
  );
}

function CodeCard({
  index,
  title,
  eyebrow,
  color,
  main,
  body,
  note,
  featured = false,
}: {
  index: string;
  title: string;
  eyebrow: string;
  color: string;
  main: string;
  body: string;
  note: string;
  featured?: boolean;
}) {
  return (
    <section
      className="rounded-sb-xl bg-sb-paper px-4 py-4"
      style={{
        boxShadow: featured
          ? `0 10px 26px ${color}35, inset 0 0 0 1.5px ${color}70`
          : "var(--shadow-sb-card), inset 0 0 0 1px rgba(91,74,54,0.06)",
      }}
    >
      <div className="flex items-start gap-3">
        <div
          className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full text-[13px] font-extrabold text-white"
          style={{ background: color }}
        >
          {index}
        </div>
        <div className="min-w-0">
          <div className="text-[10.5px] font-extrabold tracking-wider uppercase text-sb-olive-light">
            {eyebrow}
          </div>
          <h2 className="mt-0.5 text-[16px] font-extrabold text-sb-ink tracking-tight">
            {title}
          </h2>
        </div>
      </div>
      <h3 className="mt-4 text-[18px] font-extrabold leading-snug text-sb-ink">
        {main}
      </h3>
      <p className="mt-2 text-[13.5px] leading-relaxed text-sb-ink-2">
        {body}
      </p>
      <p className="mt-3 rounded-sb-md px-3 py-2 text-[12px] font-semibold leading-relaxed text-sb-ink-2" style={{ background: "var(--sb-cream)" }}>
        {note} 이것은 약점이 아니라, 마음의 컬러를 조절하라는 신호에 가까워요.
      </p>
    </section>
  );
}

function PersonaCard({ report }: { report: ColorNumerologyReport }) {
  return (
    <section
      className="rounded-sb-xl bg-sb-paper px-4 py-4"
      style={{ boxShadow: "var(--shadow-sb-card), inset 0 0 0 1px rgba(91,74,54,0.06)" }}
    >
      <div className="text-[10.5px] font-extrabold tracking-wider uppercase text-sb-olive-light">
        페르소나
      </div>
      <h2 className="mt-1 text-[18px] font-extrabold text-sb-ink tracking-tight">
        {report.persona.animal} · {report.persona.keyword}의 행동 가면
      </h2>
      <p className="mt-2 text-[13.5px] leading-relaxed text-sb-ink-2">
        {report.persona.description} 관계에서는 이 가면이 먼저 보일 수 있지만, 그 안쪽에는 {report.cheat.colorKr} 핵심 컬러의 흐름이 계속 작동하고 있습니다.
      </p>
    </section>
  );
}

function TherapyCard({ report }: { report: ColorNumerologyReport }) {
  return (
    <section
      className="rounded-sb-xl px-5 py-5"
      style={{
        background: "linear-gradient(135deg, var(--sb-olive-dark), var(--sb-olive))",
        boxShadow: "var(--shadow-sb-pop)",
      }}
    >
      <div className="text-[10.5px] font-extrabold tracking-wider uppercase text-sb-yuzu-light">
        Color Therapy
      </div>
      <h2 className="mt-1 text-[19px] font-extrabold text-white leading-snug tracking-tight">
        {report.therapy.title}
      </h2>
      <p className="mt-3 text-[13px] font-semibold leading-relaxed text-white/82">
        {report.therapy.body}
      </p>
      <ul className="mt-4 flex flex-col gap-2">
        {report.therapy.actions.map((action) => (
          <li key={action} className="flex gap-2 text-[12.5px] font-semibold leading-relaxed text-white/88">
            <span className="mt-[5px] h-1.5 w-1.5 shrink-0 rounded-full bg-sb-yuzu" />
            <span>{action}</span>
          </li>
        ))}
      </ul>
      <p className="mt-4 text-[12px] leading-relaxed text-white/68">
        고독, 구설, 기복 같은 키워드가 나와도 끝이 정해졌다는 뜻은 아니에요. 베풂과 루틴, 색의 사용법을 바꾸면 운의 체감은 충분히 달라질 수 있습니다.
      </p>
    </section>
  );
}

function CrossSell() {
  return (
    <section
      className="rounded-sb-lg bg-sb-paper px-4 py-4"
      style={{ boxShadow: "var(--shadow-sb-card), inset 0 0 0 1px rgba(91,74,54,0.06)" }}
    >
      <h2 className="text-[14px] font-extrabold text-sb-ink tracking-tight">
        더 깊게 보고 싶다면
      </h2>
      <p className="mt-1 text-[12px] leading-relaxed text-sb-ink-2">
        컬러는 가볍게 보는 입구, 바라사주는 생년월일시까지 반영한 전체 리포트예요.
      </p>
      <Link
        href="/saju"
        className="mt-3 flex items-center justify-center rounded-full bg-sb-olive px-4 py-3 text-[13px] font-extrabold text-white"
      >
        바라사주로 더 자세히 보기
      </Link>
    </section>
  );
}

function ErrorCard({ message }: { message: string }) {
  return (
    <main className="px-4 pt-4">
      <section
        className="bg-sb-paper rounded-sb-lg px-5 py-7 text-center"
        style={{ boxShadow: "var(--shadow-sb-card), inset 0 0 0 1px rgba(91,74,54,0.06)" }}
      >
        <h1 className="text-[16px] font-extrabold text-sb-ink mb-2">컬러 리포트를 만들 수 없어요</h1>
        <p className="text-[13px] text-sb-ink-2 leading-relaxed">{message}</p>
        <Link
          href="/color"
          className="mt-4 inline-flex rounded-full bg-sb-olive text-white text-[13px] font-bold px-4 py-2.5"
        >
          다시 입력하기
        </Link>
      </section>
    </main>
  );
}

function getAnalysisDate(sp: Awaited<SearchParams>):
  | {
      lunarMonth: number;
      lunarDay: number;
      sourceLabel: string;
      lunarLabel: string;
    }
  | null {
  if (sp.calendar === "solar") {
    const match = sp.solarDate?.match(/^(\d{4})-(\d{2})-(\d{2})$/);
    if (!match) return null;
    const year = Number(match[1]);
    const month = Number(match[2]);
    const day = Number(match[3]);
    if (!Number.isInteger(year) || !Number.isInteger(month) || !Number.isInteger(day)) {
      return null;
    }
    const lunar = getLunarDate(year, month, day);
    const lunarLabel = `음력 ${lunar.isLeapMonth ? "윤" : ""}${lunar.lunarMonth}월 ${lunar.lunarDay}일`;
    return {
      lunarMonth: lunar.lunarMonth,
      lunarDay: lunar.lunarDay,
      sourceLabel: `양력 ${year}년 ${month}월 ${day}일`,
      lunarLabel,
    };
  }

  const month = Number(sp.month);
  const day = Number(sp.day);
  if (!Number.isInteger(month) || !Number.isInteger(day)) return null;
  return {
    lunarMonth: month,
    lunarDay: day,
    sourceLabel: "",
    lunarLabel: `음력 ${month}월 ${day}일`,
  };
}

function BackIcon() {
  return (
    <svg width="10" height="10" viewBox="0 0 10 10" fill="none" aria-hidden>
      <path
        d="M6.5 2L3.5 5L6.5 8"
        stroke="var(--sb-ink-2)"
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}
