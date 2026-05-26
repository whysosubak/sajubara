"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import ContentDisclaimer from "@/app/components/ContentDisclaimer";
import {
  MOCK_ENTITLEMENT_COOKIE,
  isScopeUnlocked,
  parseMockEntitlements,
} from "@/lib/auth/mock-entitlements";
import {
  getSelectedId,
  loadPeople,
  setSelectedId,
  type Person,
} from "@/lib/bara/people";
import {
  BRANCHES,
  BRANCH_LABEL_KR,
  ELEMENT_COLOR_KR,
  ELEMENTS,
  type Branch,
  type Element,
} from "@/lib/bara/types";
import {
  reportCheckoutHref,
  reportSajuHref,
} from "@/lib/saju/report-links";
import { sajuPersonKey } from "@/lib/saju/scope";

type PurposeKey =
  | "move"
  | "meeting"
  | "interview"
  | "opening"
  | "wedding"
  | "surgery"
  | "travel"
  | "contract"
  | "exam"
  | "birth"
  | "reunion"
  | "other";

type TodayFortuneClientProps = {
  dateLabel: string;
  lunarLabel: string;
  initialDate?: string;
  initialPurpose?: string;
  initialMemo?: string;
  initialPaid?: boolean;
};

const PURPOSES: Array<{ key: PurposeKey; label: string; emoji: string; hint: string }> = [
  { key: "move", label: "이사", emoji: "🏠", hint: "계약·정리·이동 흐름" },
  { key: "meeting", label: "상견례", emoji: "🤝", hint: "첫인상과 말의 온도" },
  { key: "interview", label: "면접", emoji: "💼", hint: "표현력과 평가운" },
  { key: "opening", label: "개업", emoji: "🏪", hint: "시작운과 손님 흐름" },
  { key: "wedding", label: "결혼", emoji: "💒", hint: "관계 안정과 축하운" },
  { key: "surgery", label: "수술", emoji: "🏥", hint: "컨디션과 회복 리듬" },
  { key: "travel", label: "여행", emoji: "✈️", hint: "이동수와 변수" },
  { key: "contract", label: "계약", emoji: "📝", hint: "문서운과 조건 확인" },
  { key: "exam", label: "시험", emoji: "📖", hint: "집중력과 실수 방지" },
  { key: "birth", label: "출산", emoji: "👶", hint: "회복과 가족운" },
  { key: "reunion", label: "재회연락", emoji: "💌", hint: "감정선과 답장운" },
  { key: "other", label: "기타", emoji: "📌", hint: "직접 적은 목적 기준" },
];

const CATEGORY_META = [
  { key: "love", label: "연애", emoji: "💞" },
  { key: "work", label: "일", emoji: "🔥" },
  { key: "money", label: "돈", emoji: "💰" },
  { key: "health", label: "건강", emoji: "🌿" },
  { key: "relation", label: "관계", emoji: "👥" },
] as const;

export default function TodayFortuneClient({
  dateLabel,
  lunarLabel,
  initialDate,
  initialPurpose,
  initialMemo,
  initialPaid = false,
}: TodayFortuneClientProps) {
  const [people, setPeople] = useState<Person[]>([]);
  const [selectedId, setSelected] = useState<string | null>(null);
  const [hydrated, setHydrated] = useState(false);
  const [purpose, setPurpose] = useState<PurposeKey>(
    isPurposeKey(initialPurpose) ? initialPurpose : "exam",
  );
  const [memo, setMemo] = useState(initialMemo ?? "");
  const [targetDate, setTargetDate] = useState(initialDate ?? nextKstDateISO());
  const [hasPaidTarget, setHasPaidTarget] = useState(false);

  useEffect(() => {
    /* eslint-disable react-hooks/set-state-in-effect */
    const list = loadPeople();
    setPeople(list);
    setSelected(getSelectedId() ?? list[0]?.id ?? null);
    setHydrated(true);
    /* eslint-enable react-hooks/set-state-in-effect */
  }, []);

  const selected = people.find((p) => p.id === selectedId) ?? people[0] ?? null;
  const todayISO = useMemo(() => kstDateISO(), []);
  const todayFortune = useMemo(
    () => (selected ? buildDailyFortune(selected, todayISO, "other", "") : null),
    [selected, todayISO],
  );
  const targetPurpose = PURPOSES.find((item) => item.key === purpose) ?? PURPOSES[0];
  const targetProduct = selected
    ? dailyProductKey(selected, targetDate, purpose)
    : "";
  const targetUnlocked = hasPaidTarget || initialPaid;
  const targetFortune = useMemo(
    () => (selected ? buildDailyFortune(selected, targetDate, purpose, memo) : null),
    [memo, purpose, selected, targetDate],
  );
  const hasTargetQuery = Boolean(initialDate || initialPurpose || initialMemo);
  const inPaidDayMode = Boolean(targetFortune && targetUnlocked && hasTargetQuery);

  useEffect(() => {
    if (!selected || !targetProduct) return;
    const entitlements = parseMockEntitlements(readCookie(MOCK_ENTITLEMENT_COOKIE));
    /* eslint-disable react-hooks/set-state-in-effect */
    setHasPaidTarget(
      isScopeUnlocked(entitlements, { product: "daily", key: targetProduct }),
    );
    /* eslint-enable react-hooks/set-state-in-effect */
  }, [selected, targetProduct]);

  function handleSelectPerson(person: Person) {
    setSelectedId(person.id);
    setSelected(person.id);
    try {
      localStorage.setItem("sajubara:lastSajuCardId", person.cardId);
      localStorage.setItem("sajubara:lastSajuInput", JSON.stringify(person.input));
    } catch {
      // best-effort
    }
  }

  if (!hydrated) {
    return (
      <div className="flex-1 overflow-y-auto px-4 pt-4">
        <EmptyCard text="오늘의 운세를 준비하고 있어요…" />
      </div>
    );
  }

  if (people.length === 0 || !selected) {
    return (
      <div className="flex-1 overflow-y-auto px-4 pt-4">
        <section
          className="rounded-sb-xl bg-sb-paper px-5 py-7 text-center"
          style={{ boxShadow: "var(--shadow-sb-card), inset 0 0 0 1px rgba(91,74,54,0.06)" }}
        >
          <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-sb-cream text-[26px]">
            🛁
          </div>
          <h1 className="text-[22px] font-extrabold text-sb-ink">
            먼저 사주 정보를 등록해주세요
          </h1>
          <p className="mt-3 text-[13px] font-semibold leading-relaxed text-sb-ink-2">
            오늘의 운세는 저장된 사람을 기준으로 매일 무료로 볼 수 있어요.
          </p>
          <Link
            href="/saju"
            className="mt-6 inline-flex h-12 w-full items-center justify-center rounded-full text-[14px] font-extrabold text-sb-olive-dark"
            style={{
              background:
                "linear-gradient(135deg, var(--sb-yuzu-light), var(--sb-yuzu) 62%, var(--sb-yuzu-dark))",
              boxShadow: "var(--shadow-sb-pop)",
            }}
          >
            내 사주 등록하기
          </Link>
        </section>
      </div>
    );
  }

  if (inPaidDayMode && targetFortune) {
    return (
      <FocusedPaidDailyView
        person={selected}
        fortune={targetFortune}
        purpose={targetPurpose}
        date={targetDate}
        memo={memo}
      />
    );
  }

  return (
    <div className="flex-1 overflow-y-auto px-4 pt-3 pb-8">
      <section className="flex gap-2 overflow-x-auto pb-2">
        {people.map((person) => {
          const active = person.id === selected.id;
          return (
            <button
              key={person.id}
              type="button"
              onClick={() => handleSelectPerson(person)}
              className="shrink-0 rounded-full px-3.5 py-2 text-[12px] font-extrabold"
              style={{
                background: active ? "var(--sb-olive)" : "var(--sb-paper)",
                color: active ? "white" : "var(--sb-ink-2)",
                boxShadow: active
                  ? "0 5px 14px rgba(92,110,62,0.22)"
                  : "inset 0 0 0 1px var(--sb-hairline)",
              }}
            >
              {person.input.name}
            </button>
          );
        })}
        <Link
          href="/people"
          className="shrink-0 rounded-full bg-sb-paper px-3.5 py-2 text-[12px] font-extrabold text-sb-ink-3"
          style={{ boxShadow: "inset 0 0 0 1px var(--sb-hairline)" }}
        >
          관리
        </Link>
      </section>

      {todayFortune && (
        <TodayHero
          fortune={todayFortune}
          dateLabel={dateLabel}
          lunarLabel={lunarLabel}
        />
      )}

      {todayFortune && <ScorePanel scores={todayFortune.scores} />}

      {todayFortune && (
        <section className="mt-3 grid gap-2">
          {todayFortune.sections.map((section) => (
            <article
              key={section.title}
              className="rounded-sb-lg bg-sb-paper px-4 py-4"
              style={{ boxShadow: "var(--shadow-sb-card), inset 0 0 0 1px rgba(91,74,54,0.06)" }}
            >
              <h3 className="text-[14px] font-extrabold text-sb-ink">
                {section.emoji} {section.title}
              </h3>
              <p className="mt-2 text-[13px] font-semibold leading-relaxed text-sb-ink-2">
                {section.body}
              </p>
            </article>
          ))}
        </section>
      )}

      <section
        className="mt-4 rounded-sb-xl bg-sb-paper px-4 py-4"
        style={{ boxShadow: "var(--shadow-sb-card), inset 0 0 0 1px rgba(91,74,54,0.06)" }}
      >
        <div className="flex items-start justify-between gap-3">
          <div>
            <p className="text-[11px] font-extrabold uppercase tracking-[0.16em] text-sb-ink-3">
              Pick a Day
            </p>
            <h2 className="mt-1 text-[20px] font-extrabold leading-tight text-sb-ink">
              다른 하루가 궁금하다면
            </h2>
          </div>
          <span className="rounded-full bg-sb-cream px-2.5 py-1 text-[11px] font-extrabold text-sb-olive-dark">
            1일 990원
          </span>
        </div>
        <p className="mt-2 text-[12.5px] font-semibold leading-relaxed text-sb-ink-2">
          목적을 고르면 그 날짜를 “그 일에 써도 괜찮은지” 중심으로 봐드릴게요.
        </p>

        <div className="mt-4 grid grid-cols-3 gap-2">
          {PURPOSES.map((item) => {
            const active = item.key === purpose;
            return (
              <button
                key={item.key}
                type="button"
                onClick={() => setPurpose(item.key)}
                className="min-h-[42px] rounded-full px-2 text-[12px] font-extrabold"
                style={{
                  background: active ? "var(--sb-terra)" : "var(--sb-paper)",
                  color: active ? "white" : "var(--sb-ink-2)",
                  boxShadow: active
                    ? "0 5px 12px rgba(185,102,79,0.2)"
                    : "inset 0 0 0 1px var(--sb-hairline)",
                }}
              >
                <span aria-hidden>{item.emoji}</span> {item.label}
              </button>
            );
          })}
        </div>

        <label className="mt-4 block">
          <span className="text-[12px] font-extrabold text-sb-ink-2">
            목적 메모
          </span>
          <textarea
            value={memo}
            onChange={(event) => setMemo(event.target.value.slice(0, 160))}
            placeholder={`${targetPurpose.label} 관련해서 보고 싶은 내용을 적어주세요`}
            className="mt-2 min-h-[86px] w-full resize-none rounded-sb-md bg-sb-cream px-3.5 py-3 text-[14px] font-semibold text-sb-ink outline-none"
            style={{ boxShadow: "inset 0 0 0 1px var(--sb-hairline)" }}
          />
          <span className="mt-1 block text-right text-[11px] font-semibold text-sb-ink-3">
            {memo.length}/160
          </span>
        </label>

        <label className="mt-3 block">
          <span className="text-[12px] font-extrabold text-sb-ink-2">
            볼 날짜
          </span>
          <input
            type="date"
            min={todayISO}
            value={targetDate}
            onChange={(event) => setTargetDate(event.target.value)}
            className="mt-2 h-12 w-full rounded-sb-md bg-sb-cream px-3.5 text-[14px] font-extrabold text-sb-ink outline-none"
            style={{ boxShadow: "inset 0 0 0 1px var(--sb-hairline)" }}
          />
        </label>

        <Link
          href={
            targetUnlocked
              ? buildReturnTo({ date: targetDate, purpose, memo })
              : reportCheckoutHref({
                  product: targetProduct,
                  title: `${formatDateShort(targetDate)} ${targetPurpose.label} 운세`,
                  amount: 990,
                  returnTo: buildReturnTo({ date: targetDate, purpose, memo }),
                })
          }
          className="mt-4 flex h-12 w-full items-center justify-center rounded-full text-[14px] font-extrabold text-sb-olive-dark"
          style={{
            background:
              "linear-gradient(135deg, var(--sb-yuzu-light), var(--sb-yuzu) 62%, var(--sb-yuzu-dark))",
            boxShadow: "0 4px 14px rgba(216,154,42,0.36)",
          }}
        >
          {targetUnlocked ? "열어둔 이 날 운세 자세히 보기" : "990원으로 이 날 운세 보기"}
        </Link>
      </section>

      {targetFortune && targetUnlocked && (
        <PaidDailyResult
          fortune={targetFortune}
          memo={memo}
        />
      )}

      <ContentDisclaimer compact className="mt-4" />

      <section
        className="mt-4 rounded-sb-xl bg-sb-paper px-4 py-4"
        style={{ boxShadow: "var(--shadow-sb-card), inset 0 0 0 1px rgba(91,74,54,0.06)" }}
      >
        <p className="text-[11px] font-extrabold text-sb-ink-3">
          더 깊게 보고 싶다면
        </p>
        <h2 className="mt-1 text-[18px] font-extrabold text-sb-ink">
          {selected.input.name}님의 사주바라 전체 해설
        </h2>
        <p className="mt-1 text-[12px] font-semibold text-sb-ink-2">
          성격·재물·관계·그림자 카드까지 한 번에 정리해요.
        </p>
        <Link
          href={reportCheckoutHref({
            product: `saju:${sajuPersonKey(selected.input)}`,
            title: "사주바라 전체 해설",
            amount: 990,
            returnTo: reportSajuHref(selected.input, true),
          })}
          className="mt-3 flex h-11 w-full items-center justify-center rounded-full bg-sb-olive text-[13px] font-extrabold text-white"
        >
          사주바라 전체 해설 열기
        </Link>
      </section>
    </div>
  );
}

function TodayHero({
  fortune,
  dateLabel,
  lunarLabel,
}: {
  fortune: DailyFortune;
  dateLabel: string;
  lunarLabel: string;
}) {
  const headline = splitTodayHeadline(fortune.headline);

  return (
    <section
      className="mt-1 rounded-sb-xl px-4 py-5"
      style={{
        background:
          "linear-gradient(145deg, rgba(253,230,209,0.95), rgba(255,253,245,0.96) 52%, rgba(219,236,224,0.92))",
        boxShadow: "var(--shadow-sb-hero), inset 0 1px 0 rgba(255,255,255,0.68)",
      }}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="inline-flex rounded-full bg-white/45 px-2.5 py-1 text-[11px] font-extrabold text-sb-ink-3">
            {dateLabel}
          </p>
          <p className="mt-2 break-keep text-[10.5px] font-extrabold leading-snug text-sb-ink-3 opacity-75">
            {lunarLabel}
          </p>
        </div>
        <span className="shrink-0 rounded-full bg-sb-paper px-2.5 py-1 text-[11px] font-extrabold text-sb-olive-dark">
          오늘 무료
        </span>
      </div>

      <div className="mt-5">
        {headline.subject && (
          <p className="mb-1 text-[13px] font-extrabold text-sb-olive-dark">
            {headline.subject}
          </p>
        )}
        <h1 className="max-w-[320px] break-keep text-[22px] font-extrabold leading-[1.24] text-sb-ink">
          {headline.main}
        </h1>
      </div>
      <p className="mt-3 break-keep text-[13px] font-semibold leading-relaxed text-sb-ink-2">
        {fortune.summary}
      </p>

      <div className="mt-5 flex items-end justify-between">
        <div>
          <p className="text-[11px] font-extrabold text-sb-ink-3">
            오늘의 점수
          </p>
          <div className="mt-1 flex items-baseline gap-1">
            <span className="text-[44px] font-black leading-none text-sb-olive-dark">
              {fortune.total}
            </span>
            <span className="text-[15px] font-extrabold text-sb-ink-3">
              /100
            </span>
          </div>
        </div>
        <div className="rounded-full bg-sb-paper px-3 py-2 text-[12px] font-extrabold text-sb-ink-2">
          {fortune.keyword}
        </div>
      </div>
    </section>
  );
}

function splitTodayHeadline(headline: string): { subject: string; main: string } {
  const match = headline.match(/^(.+?님),\s*(.+)$/);
  if (!match) return { subject: "", main: headline };
  return { subject: match[1], main: match[2] };
}

function FocusedPaidDailyView({
  person,
  fortune,
  purpose,
  date,
  memo,
}: {
  person: Person;
  fortune: DailyFortune;
  purpose: (typeof PURPOSES)[number];
  date: string;
  memo: string;
}) {
  return (
    <div className="flex-1 overflow-y-auto px-4 pt-3 pb-8">
      <section
        className="rounded-sb-xl px-4 py-5"
        style={{
          background:
            "linear-gradient(145deg, rgba(255,244,224,0.98), rgba(255,253,245,0.98) 56%, rgba(220,236,229,0.92))",
          boxShadow: "var(--shadow-sb-hero), inset 0 1px 0 rgba(255,255,255,0.72)",
        }}
      >
        <div className="flex items-start justify-between gap-3">
          <div>
            <p className="text-[11px] font-extrabold uppercase tracking-[0.16em] text-sb-olive-dark">
              지정일 운세 리포트
            </p>
            <p className="mt-1 text-[12px] font-bold text-sb-ink-3">
              {person.input.name}님 · {formatDateShort(date)}
            </p>
          </div>
          <Link
            href="/today"
            className="shrink-0 rounded-full bg-white/60 px-3 py-1.5 text-[11px] font-extrabold text-sb-ink-2"
            style={{ boxShadow: "inset 0 0 0 1px rgba(91,74,54,0.08)" }}
          >
            다른 날짜
          </Link>
        </div>

        <h1 className="mt-5 break-keep text-[25px] font-black leading-[1.18] text-sb-ink">
          {purpose.emoji} {purpose.label} 기준으로 보는
          <br />
          이 날의 운세
        </h1>
        <p className="mt-3 break-keep text-[13px] font-semibold leading-relaxed text-sb-ink-2">
          오늘의 무료 운세와 섞지 않고, 결제한 날짜의 판단·시간대·주의 변수만 모아 정리했어요.
        </p>
        {memo.trim() && (
          <p className="mt-4 rounded-sb-md bg-white/55 px-3.5 py-3 text-[13px] font-bold leading-relaxed text-sb-ink-2">
            {memo.trim()}
          </p>
        )}
        <div className="mt-5 flex items-end justify-between">
          <div>
            <p className="text-[11px] font-extrabold text-sb-ink-3">
              이 날의 점수
            </p>
            <div className="mt-1 flex items-baseline gap-1">
              <span className="text-[46px] font-black leading-none text-sb-olive-dark">
                {fortune.total}
              </span>
              <span className="text-[15px] font-extrabold text-sb-ink-3">
                /100
              </span>
            </div>
          </div>
          <div className="rounded-full bg-sb-paper px-3 py-2 text-[12px] font-extrabold text-sb-ink-2">
            {fortune.keyword}
          </div>
        </div>
      </section>

      <PaidDayCalendar date={date} score={fortune.total} />
      <ScorePanel scores={fortune.scores} title="이 날의 세부 점수" />
      <PaidDailyResult
        fortune={fortune}
        memo={memo}
      />

      <section
        className="mt-4 rounded-sb-xl bg-sb-paper px-4 py-4"
        style={{ boxShadow: "var(--shadow-sb-card), inset 0 0 0 1px rgba(91,74,54,0.06)" }}
      >
        <p className="text-[11px] font-extrabold text-sb-ink-3">
          지정일 운세 더 보기
        </p>
        <h2 className="mt-1 text-[18px] font-extrabold text-sb-ink">
          다른 날짜도 목적별로 볼 수 있어요
        </h2>
        <p className="mt-1 text-[12px] font-semibold leading-relaxed text-sb-ink-2">
          계약·면접·여행처럼 목적을 바꾸면 같은 날도 판단 기준이 달라져요.
        </p>
        <Link
          href="/today"
          className="mt-3 flex h-11 w-full items-center justify-center rounded-full bg-sb-olive text-[13px] font-extrabold text-white"
        >
          날짜와 목적 다시 고르기
        </Link>
      </section>

      <ContentDisclaimer compact className="mt-4" />
    </div>
  );
}

function PaidDayCalendar({ date, score }: { date: string; score: number }) {
  const days = buildCalendarDays(date, score);
  const [year, month] = date.split("-").map(Number);

  return (
    <section
      className="mt-4 rounded-sb-xl bg-sb-paper px-4 py-4"
      style={{ boxShadow: "var(--shadow-sb-card), inset 0 0 0 1px rgba(91,74,54,0.06)" }}
    >
      <div className="flex items-center justify-between">
        <div>
          <p className="text-[11px] font-extrabold uppercase tracking-[0.16em] text-sb-ink-3">
            열어둔 날짜
          </p>
          <h2 className="mt-1 text-[18px] font-extrabold text-sb-ink">
            {year}년 {month}월 지정일
          </h2>
        </div>
        <span className="rounded-full bg-sb-cream px-2.5 py-1 text-[11px] font-extrabold text-sb-olive-dark">
          결제 완료
        </span>
      </div>
      <p className="mt-2 text-[12px] font-semibold leading-relaxed text-sb-ink-3">
        결제한 날짜만 점수와 상세 해설이 열려요. 다른 날짜는 새로 선택해서 볼 수 있습니다.
      </p>
      <div className="mt-4 grid grid-cols-7 gap-1.5 text-center">
        {["일", "월", "화", "수", "목", "금", "토"].map((day) => (
          <div key={day} className="text-[10px] font-extrabold text-sb-ink-3">
            {day}
          </div>
        ))}
        {days.map((cell, index) => {
          if (!cell.day) return <div key={`blank-${index}`} />;
          return (
            <div
              key={cell.iso}
              className="min-h-[54px] rounded-[14px] px-1.5 py-1.5 text-left"
              style={{
                background: cell.selected ? "var(--sb-olive)" : "var(--sb-cream)",
                color: cell.selected ? "white" : "var(--sb-ink-3)",
                boxShadow: cell.selected
                  ? "0 8px 18px rgba(92,110,62,0.22)"
                  : "inset 0 0 0 1px rgba(91,74,54,0.05)",
              }}
            >
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-extrabold">{cell.day}</span>
                {cell.selected && <span className="text-[10px]">✓</span>}
              </div>
              <div className="mt-2 text-right text-[12px] font-black">
                {cell.selected ? `${cell.score}점` : "?"}
              </div>
            </div>
          );
        })}
      </div>
    </section>
  );
}

type CalendarCell = {
  day: number | null;
  iso: string;
  selected: boolean;
  score?: number;
};

function buildCalendarDays(date: string, score: number): CalendarCell[] {
  const [year, month, selectedDay] = date.split("-").map(Number);
  if (
    !Number.isFinite(year) ||
    !Number.isFinite(month) ||
    !Number.isFinite(selectedDay)
  ) {
    return [];
  }

  const firstWeekday = new Date(Date.UTC(year, month - 1, 1)).getUTCDay();
  const daysInMonth = new Date(Date.UTC(year, month, 0)).getUTCDate();
  const cells: CalendarCell[] = [];

  for (let index = 0; index < firstWeekday; index += 1) {
    cells.push({
      day: null,
      iso: `blank-${index}`,
      selected: false,
    });
  }

  for (let day = 1; day <= daysInMonth; day += 1) {
    const iso = `${year}-${String(month).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
    const selected = day === selectedDay;
    cells.push({
      day,
      iso,
      selected,
      score: selected ? score : undefined,
    });
  }

  return cells;
}

function ScorePanel({
  scores,
  title = "오늘의 세부 흐름",
}: {
  scores: DailyFortune["scores"];
  title?: string;
}) {
  return (
    <section
      className="mt-3 rounded-sb-xl bg-sb-paper px-4 py-4"
      style={{ boxShadow: "var(--shadow-sb-card), inset 0 0 0 1px rgba(91,74,54,0.06)" }}
    >
      <h2 className="text-[14px] font-extrabold text-sb-ink">
        {title}
      </h2>
      <div className="mt-3 grid gap-2.5">
        {CATEGORY_META.map((item) => {
          const score = scores[item.key];
          return (
            <div key={item.key} className="grid grid-cols-[58px_1fr_32px] items-center gap-2">
              <div className="text-[12px] font-extrabold text-sb-ink-2">
                <span aria-hidden>{item.emoji}</span> {item.label}
              </div>
              <div className="h-2.5 rounded-full bg-sb-cream overflow-hidden">
                <div
                  className="h-full rounded-full"
                  style={{
                    width: `${score}%`,
                    background:
                      item.key === "love"
                        ? "#F3A6B7"
                        : item.key === "work"
                          ? "#E9A331"
                          : item.key === "money"
                            ? "#E5C84D"
                            : item.key === "health"
                              ? "#8FBF7A"
                              : "#9DB7D8",
                  }}
                />
              </div>
              <div className="text-right text-[12px] font-extrabold text-sb-ink-2">
                {score}
              </div>
            </div>
          );
        })}
      </div>
    </section>
  );
}

function PaidDailyResult({
  fortune,
  memo,
}: {
  fortune: DailyFortune;
  memo: string;
}) {
  return (
    <section
      className="mt-4 rounded-sb-xl bg-sb-paper px-4 py-4"
      style={{ boxShadow: "var(--shadow-sb-card), inset 0 0 0 1px rgba(91,74,54,0.06)" }}
    >
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-[11px] font-extrabold uppercase tracking-[0.16em] text-sb-ink-3">
            Paid Day Report
          </p>
          <h2 className="mt-1 text-[19px] font-extrabold leading-tight text-sb-ink">
            결제한 날짜 상세 해설
          </h2>
        </div>
        <span className="rounded-full bg-sb-cream px-2.5 py-1 text-[11px] font-extrabold text-sb-olive-dark">
          열림
        </span>
      </div>
      {memo.trim() && (
        <p className="mt-3 rounded-sb-md bg-sb-cream px-3 py-2 text-[12px] font-bold text-sb-ink-2">
          {memo.trim()}
        </p>
      )}
      <div className="mt-3 grid gap-2.5">
        <article className="rounded-sb-md bg-sb-cream px-3.5 py-3">
          <h3 className="text-[13px] font-extrabold text-sb-ink">
            이 날의 결론
          </h3>
          <p className="mt-2 text-[13px] font-semibold leading-relaxed text-sb-ink-2">
            {fortune.paidReading}
          </p>
        </article>
        <article className="rounded-sb-md bg-white px-3.5 py-3" style={{ boxShadow: "inset 0 0 0 1px var(--sb-hairline)" }}>
          <h3 className="text-[13px] font-extrabold text-sb-ink">
            시간대별 사용법
          </h3>
          <div className="mt-3 grid gap-2">
            {fortune.paidTimeline.map((item) => (
              <div
                key={item.label}
                className="grid grid-cols-[52px_1fr] gap-3 rounded-[18px] bg-sb-cream px-3 py-3"
              >
                <div className="text-center">
                  <span className="inline-flex min-w-10 justify-center rounded-full bg-sb-paper px-2 py-1 text-[11px] font-extrabold text-sb-olive-dark">
                    {item.label}
                  </span>
                </div>
                <div>
                  <p className="text-[13px] font-extrabold text-sb-ink">
                    {item.title}
                  </p>
                  <p className="mt-1 text-[12.5px] font-semibold leading-relaxed text-sb-ink-2">
                    {item.body}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </article>
        {fortune.paidSections.map((section) => (
          <article key={section.title} className="rounded-sb-md bg-sb-cream px-3.5 py-3">
            <h3 className="text-[13px] font-extrabold text-sb-ink">
              {section.emoji} {section.title}
            </h3>
            <p className="mt-2 whitespace-pre-line text-[13px] font-semibold leading-relaxed text-sb-ink-2">
              {section.body}
            </p>
          </article>
        ))}
        <div className="grid grid-cols-1 gap-2.5 sm:grid-cols-2">
          <article className="rounded-sb-md bg-white px-3.5 py-3" style={{ boxShadow: "inset 0 0 0 1px var(--sb-hairline)" }}>
            <h3 className="text-[13px] font-extrabold text-sb-ink">
              하면 좋은 것
            </h3>
            <ul className="mt-2 grid gap-1.5 text-[12.5px] font-semibold leading-relaxed text-sb-ink-2">
              {fortune.paidDo.map((item) => (
                <li key={item} className="flex gap-2">
                  <span className="mt-[7px] h-1.5 w-1.5 shrink-0 rounded-full bg-sb-olive" />
                  <span>{item}</span>
                </li>
              ))}
            </ul>
          </article>
          <article className="rounded-sb-md bg-white px-3.5 py-3" style={{ boxShadow: "inset 0 0 0 1px var(--sb-hairline)" }}>
            <h3 className="text-[13px] font-extrabold text-sb-ink">
              피할 것
            </h3>
            <ul className="mt-2 grid gap-1.5 text-[12.5px] font-semibold leading-relaxed text-sb-ink-2">
              {fortune.paidAvoid.map((item) => (
                <li key={item} className="flex gap-2">
                  <span className="mt-[7px] h-1.5 w-1.5 shrink-0 rounded-full bg-sb-terra" />
                  <span>{item}</span>
                </li>
              ))}
            </ul>
          </article>
        </div>
        <article className="rounded-sb-md bg-white px-3.5 py-3" style={{ boxShadow: "inset 0 0 0 1px var(--sb-hairline)" }}>
          <h3 className="text-[13px] font-extrabold text-sb-ink">
            실행 체크리스트
          </h3>
          <ul className="mt-2 grid gap-1.5 text-[13px] font-semibold leading-relaxed text-sb-ink-2">
            {fortune.paidChecklist.map((item) => (
              <li key={item} className="flex gap-2">
                <span className="mt-[7px] h-1.5 w-1.5 shrink-0 rounded-full bg-sb-yuzu-dark" />
                <span>{item}</span>
              </li>
            ))}
          </ul>
        </article>
      </div>
    </section>
  );
}

function EmptyCard({ text }: { text: string }) {
  return (
    <div
      className="rounded-sb-lg bg-sb-paper px-4 py-6 text-center text-[13px] font-semibold text-sb-ink-3"
      style={{ boxShadow: "var(--shadow-sb-card), inset 0 0 0 1px rgba(91,74,54,0.06)" }}
    >
      {text}
    </div>
  );
}

type DailyFortune = {
  headline: string;
  summary: string;
  keyword: string;
  total: number;
  scores: Record<(typeof CATEGORY_META)[number]["key"], number>;
  sections: Array<{ emoji: string; title: string; body: string }>;
  paidReading: string;
  paidTimeline: Array<{ label: string; title: string; body: string }>;
  paidSections: Array<{ emoji: string; title: string; body: string }>;
  paidDo: string[];
  paidAvoid: string[];
  paidChecklist: string[];
  action: string;
};

function buildDailyFortune(
  person: Person,
  date: string,
  purpose: PurposeKey,
  memo: string,
): DailyFortune {
  const input = person.input;
  const profile = buildDailyProfile(person);
  const seed = hash(
    `${person.cardId}|${input.birthDate}|${input.birthTime}|${input.gender}|${input.loveStatus ?? ""}|${input.jobStatus ?? ""}|${date}|${purpose}|${memo}`,
  );
  const profileSeed = hash(`${person.cardId}|${input.birthDate}|${input.birthTime}|${input.gender}`);
  const total = 72 + ((seed + profileSeed) % 22);
  const purposeMeta = PURPOSES.find((item) => item.key === purpose) ?? PURPOSES[0];
  const keyword = pick(
    [
      "정리운",
      "집중운",
      "대화운",
      "회복운",
      "문서운",
      "속도조절",
      "선택운",
      "관찰운",
      "마무리운",
      "약속운",
      "컨디션운",
      "정돈운",
      "설득운",
      "거리두기운",
    ],
    seed + profileSeed,
  );
  const focus = pick(
    [
      `${profile.strength}을 살리면 작게 미뤄둔 일을 끝내기 좋습니다`,
      `${profile.pace}이 맞을 때 말보다 결과물이 먼저 정리됩니다`,
      `${profile.context}에서는 오전보다 오후에 판단이 더 또렷해집니다`,
      `${profile.strength}을 앞세우면 새로운 약속보다 기존 계획을 다듬는 쪽이 좋습니다`,
      `${profile.context}에서는 사람을 설득하기보다 기록으로 남기는 편이 안전합니다`,
      `${profile.pace}으로 움직이면 오늘 해야 할 일과 미뤄도 되는 일이 잘 갈립니다`,
      `${profile.strength}이 살아나는 자리에서 작은 확인이 큰 실수를 막아줍니다`,
      `${profile.context}에선 속도를 내기보다 순서를 다시 잡는 편이 유리합니다`,
    ],
    seed + 3,
  );
  const caution = pick(
    [
      `${profile.caution} 때문에 급하게 답하면 말끝이 세게 들릴 수 있어요`,
      `${profile.caution}이 커지면 작은 지출도 뒤늦게 부담이 될 수 있어요`,
      `${profile.caution}이 올라올 땐 결정도 같이 흐려질 수 있어요`,
      `${profile.caution} 때문에 상대의 반응을 너무 빨리 해석하지 않는 편이 좋아요`,
      `${profile.caution}이 생기면 좋은 제안도 조건 확인 없이 받아들이기 쉽습니다`,
      `${profile.caution}이 강해지는 순간에는 일정과 체력을 같이 봐야 합니다`,
    ],
    seed + 8,
  );
  const name = input.name;
  const headline = pick(
    [
      `${name}님, 오늘은 ${profile.headlineSignal}이 먼저 보이는 날`,
      `${name}님, ${profile.shortTrait}이 ${keyword}을 살려요`,
      `${name}님, ${profile.timeLens}에 운이 또렷해져요`,
      `${name}님, 오늘은 ${profile.actionNoun}을 먼저 챙기세요`,
      `${name}님, ${profile.balanceNoun}이 결과를 바꾸는 날`,
      `${name}님, ${profile.cardName}의 결이 ${keyword}으로 드러나요`,
      `${name}님, ${profile.context}에서 작은 승부가 납니다`,
      `${name}님, ${profile.strength}이 필요한 하루예요`,
    ],
    seed + profileSeed + 17,
  );
  const quest = pick(
    [
      `오후 2시 전까지 ${profile.actionNoun} 하나를 먼저 정리해보세요.`,
      `${profile.context}와 관련된 말은 메신저보다 짧은 메모로 먼저 정리해보세요.`,
      `오늘 쓸 돈이나 시간을 ${profile.balanceNoun} 기준으로 먼저 정하면 마음이 편해집니다.`,
      `${profile.timeLens}에 20분 정리 시간을 넣으면 흐름이 부드러워집니다.`,
      `${profile.shortTrait}이 살아나는 일을 하나만 골라 끝까지 마무리해보세요.`,
      `${profile.caution}이 올라오는 순간에는 답장을 10분 늦춰보세요.`,
    ],
    seed + 13,
  );
  const memoText = memo.trim();
  const purposeContext = memoText ? `“${memoText}”` : `${purposeMeta.label} 일정`;
  const timing = pick(
    [
      `${profile.timeLens}에 핵심 확인을 먼저 끝내고, 확정 연락은 한 번 숨을 고른 뒤 보내는 편이 좋습니다.`,
      "오전에는 자료와 조건을 정리하고, 오후에는 사람의 반응을 확인하는 흐름이 더 안정적입니다.",
      "처음 30분은 준비와 체크에 쓰고, 실제 실행은 일정이 한번 정돈된 뒤 시작하는 편이 좋습니다.",
      `${profile.pace}을 유지하면 급한 변수보다 중요한 조건이 먼저 보입니다.`,
    ],
    seed + 19,
  );
  const relationAdvice = pick(
    [
      `${profile.context}와 연결된 사람에게는 결론부터 말하기보다 조건과 의도를 짧게 나눠 말하는 편이 좋습니다.`,
      "말이 길어지면 핵심이 흐려질 수 있으니, 상대에게 남길 문장은 한 줄로 먼저 정리해두세요.",
      "도움을 요청할 사람이 있다면 가까운 사람보다 역할이 분명한 사람에게 부탁하는 편이 안정적입니다.",
    ],
    seed + 23,
  );
  const risk = pick(
    [
      `가장 조심할 변수는 ${profile.caution}입니다. 이 흐름이 커지면 좋은 판단도 급하게 밀어붙이는 쪽으로 흐를 수 있습니다.`,
      "이 날은 결과보다 절차가 중요합니다. 확인하지 않은 조건 하나가 뒤늦게 발목을 잡을 수 있습니다.",
      "예상보다 감정 소모가 생길 수 있어요. 중요한 대화는 즉흥 답변보다 기록으로 남기는 편이 안전합니다.",
    ],
    seed + 29,
  );
  const finalAdvice = pick(
    [
      `${purposeContext}은 완전히 피할 날이라기보다, 준비 순서를 잘 잡을수록 점수가 올라가는 날입니다.`,
      `${purposeContext}은 무리하게 크게 벌리기보다 핵심 조건을 좁혀 실행할 때 더 잘 맞습니다.`,
      `${purposeContext}은 사람의 반응보다 체크리스트를 기준으로 판단할 때 흔들림이 줄어듭니다.`,
    ],
    seed + 31,
  );
  const action = pick(
    [
      `중요한 연락은 ${profile.timeLens}에 맞춰 보내고, 최종 확정은 한 번 더 미뤄보세요.`,
      `${profile.context}와 관련된 약속은 너무 붐비는 곳보다 조용히 대화가 가능한 곳이 좋습니다.`,
      `${purposeMeta.label}처럼 결과가 남는 일은 체크리스트 3개를 먼저 적어두세요.`,
      `이동이 있는 날이라면 출발 시간을 20분 넉넉하게 잡고 ${profile.actionNoun}을 먼저 확인하세요.`,
      `${profile.balanceNoun}을 기준으로 오늘 할 일 1개와 미룰 일 1개를 나눠보세요.`,
    ],
    seed + 21,
  );
  const prepAction = pick(
    [
      `${purposeMeta.label}에 필요한 서류·준비물·연락처를 한 화면에 모아두세요.`,
      `${purposeContext}에서 꼭 지켜야 할 조건 3개를 먼저 적어두세요.`,
      `시작 전에 ${profile.actionNoun}을 확인하고, 바꿀 수 없는 조건과 조정 가능한 조건을 나눠두세요.`,
      `상대가 있다면 첫 문장을 미리 정리해두세요. 이 날은 즉흥 설명보다 짧은 기준이 잘 먹힙니다.`,
    ],
    seed + 33,
  );
  const executionAction = pick(
    [
      `${profile.timeLens}에는 핵심 결정을 처리하고, 부가적인 선택은 뒤로 미루는 편이 좋습니다.`,
      `현장에서 변수가 생기면 바로 결론을 바꾸지 말고, 원래 목적과 비교한 뒤 움직이세요.`,
      `대화가 길어지면 ${profile.balanceNoun}이 흐려질 수 있으니 확인 질문을 먼저 던져보세요.`,
      `진행 중에는 새 선택지를 늘리기보다, 이미 정한 기준 안에서 고르는 편이 안정적입니다.`,
    ],
    seed + 35,
  );
  const closingAction = pick(
    [
      "마무리 직후에는 결정 내용과 다음 할 일을 한 줄씩 남기세요. 이 기록이 뒤탈을 줄입니다.",
      "끝난 뒤 바로 평가하지 말고, 30분 정도 지난 뒤 메시지나 조건을 다시 확인하세요.",
      `${profile.caution}이 남아 있으면 당일 추가 확정보다 다음 확인 일정을 잡는 편이 낫습니다.`,
      "결과가 좋아도 즉시 확대하지 말고, 다음 단계의 비용과 시간을 다시 계산해보세요.",
    ],
    seed + 37,
  );
  return {
    headline,
    summary: `${focus}. 다만 ${caution} 오늘은 크게 벌리기보다 하나를 깔끔하게 마무리할수록 운이 편해집니다.`,
    keyword,
    total,
    scores: {
      love: clampScore(total + ((seed >> 2) % 13) - 6),
      work: clampScore(total + ((seed >> 4) % 15) - 5),
      money: clampScore(total + ((seed >> 6) % 11) - 6),
      health: clampScore(total + ((seed >> 8) % 13) - 7),
      relation: clampScore(total + ((seed >> 10) % 12) - 5),
    },
    sections: [
      {
        emoji: "✨",
        title: "오늘의 분위기",
        body: `${name}님은 오늘 ${profile.cardName}의 결이 ${keyword}으로 드러납니다. 빠른 결정보다는 ${profile.actionNoun}을 한 번 더 확인한 선택이 결과를 안정시킵니다.`,
      },
      {
        emoji: "⚠️",
        title: "조심할 점",
        body: caution,
      },
      {
        emoji: "🎯",
        title: "오늘의 퀘스트",
        body: quest,
      },
    ],
    paidReading: `${formatDateShort(date)}의 ${purposeMeta.label} 운세는 총점 ${total}점입니다. ${purposeContext}은 ${focus}. 다만 ${caution} 그래서 이 날은 막연히 좋고 나쁨으로 판단하기보다, 준비 순서와 확인 조건을 먼저 좁혀야 합니다. 결론부터 말하면 진행 자체는 가능하지만, 첫 30분을 점검에 쓰느냐가 결과의 체감 차이를 만듭니다.`,
    paidTimeline: [
      {
        label: "준비",
        title: "시작 전 30분",
        body: prepAction,
      },
      {
        label: "실행",
        title: profile.timeLens,
        body: executionAction,
      },
      {
        label: "정리",
        title: "마무리 직후",
        body: closingAction,
      },
    ],
    paidSections: [
      {
        emoji: "🧭",
        title: "진행 판단",
        body: `${finalAdvice}\n점수만 보면 ${total}점으로 나쁘지 않지만, 이 날의 핵심은 무조건 밀어붙이는 것이 아니라 필요한 조건을 좁혀 잡는 데 있습니다. 특히 ${purposeMeta.label}처럼 결과가 남는 일은 “오늘 해도 되는가”보다 “어디까지 확정해도 되는가”를 나누는 편이 안전합니다.`,
      },
      {
        emoji: "⏱",
        title: "좋은 시간대",
        body: `${timing}\n급하게 시작하면 놓치는 항목이 생길 수 있으니, 첫 단계는 확인용으로 쓰고 본 실행은 한 박자 늦춰 잡아보세요. 일정 조율이 가능하다면 ${profile.timeLens}을 기준점으로 두는 것이 좋습니다.`,
      },
      {
        emoji: "💬",
        title: "사람과 말",
        body: `${relationAdvice}\n이 날은 말의 양보다 순서가 중요합니다. 상대를 설득해야 한다면 감정 설명을 길게 하기보다 목적, 조건, 요청을 한 문장씩 나눠 전달하세요.`,
      },
      {
        emoji: "⚠️",
        title: "주의 변수",
        body: `${risk}\n특히 ${purposeContext}과 직접 연결된 조건은 당일에 새로 판단하지 말고 전날이나 시작 전에 한 번 더 확인해두는 편이 좋습니다. 작은 누락 하나가 전체 인상을 흐릴 수 있습니다.`,
      },
      {
        emoji: "🌿",
        title: "보완 행동",
        body: `${action}\n색이나 방향보다 더 중요한 개운법은 기록입니다. 해야 할 일, 확인할 사람, 미뤄도 되는 일을 세 줄로 적어두면 이 날의 흐름을 훨씬 안정적으로 쓸 수 있습니다.`,
      },
    ],
    paidDo: [
      prepAction,
      `${purposeMeta.label}의 성공 기준을 “좋은 결과”가 아니라 “확정해야 할 조건”으로 바꿔보세요.`,
      `${profile.timeLens}에는 새 일을 추가하지 말고 핵심 판단 하나에 집중하세요.`,
    ],
    paidAvoid: [
      `${profile.caution}이 올라온 상태에서 바로 확정하는 일은 피하세요.`,
      `상대 반응 하나만 보고 ${purposeContext} 전체를 좋다/나쁘다로 판단하지 마세요.`,
      "당일에 새 조건을 많이 붙이면 흐름이 흐려집니다. 추가 조건은 다음 단계로 넘기세요.",
    ],
    paidChecklist: [
      `${purposeMeta.label}에 필요한 조건을 3개만 적고 빠진 항목을 먼저 확인하세요.`,
      `${profile.timeLens}에 최종 문장이나 약속 시간을 다시 점검하세요.`,
      `${profile.caution}이 올라오면 바로 확정하지 말고 10분 뒤 다시 보세요.`,
    ],
    action,
  };
}

type DailyProfile = {
  cardName: string;
  shortTrait: string;
  headlineSignal: string;
  strength: string;
  caution: string;
  context: string;
  pace: string;
  timeLens: string;
  actionNoun: string;
  balanceNoun: string;
};

const ELEMENT_DAILY_PROFILE: Record<Element, Pick<DailyProfile, "shortTrait" | "strength" | "caution" | "pace">> = {
  wood: {
    shortTrait: "새로 정리하는 감각",
    strength: "흩어진 생각을 새 방향으로 묶는 힘",
    caution: "하고 싶은 일이 한꺼번에 늘어나는 흐름",
    pace: "처음 30분을 가볍게 여는 리듬",
  },
  fire: {
    shortTrait: "반응을 빠르게 읽는 감각",
    strength: "분위기를 데우고 결정을 밀어주는 힘",
    caution: "감정의 온도가 먼저 올라가는 흐름",
    pace: "오전에 불을 붙이고 오후에 다듬는 리듬",
  },
  earth: {
    shortTrait: "현실 감각",
    strength: "흔들리는 일을 제자리로 놓는 힘",
    caution: "익숙한 방식에 오래 머무는 흐름",
    pace: "천천히 확인할수록 단단해지는 리듬",
  },
  metal: {
    shortTrait: "선 긋는 감각",
    strength: "필요한 것과 덜어낼 것을 가르는 힘",
    caution: "말이 짧아져 차갑게 들릴 수 있는 흐름",
    pace: "기준을 세운 뒤 빠르게 처리하는 리듬",
  },
  water: {
    shortTrait: "흐름을 읽는 감각",
    strength: "말하지 않은 분위기까지 살피는 힘",
    caution: "생각이 깊어져 타이밍을 놓치는 흐름",
    pace: "잠깐 물러서서 전체를 보는 리듬",
  },
};

const BRANCH_DAILY_PROFILE: Record<Branch, Pick<DailyProfile, "headlineSignal" | "context" | "actionNoun" | "balanceNoun">> = {
  rat: {
    headlineSignal: "작은 정보의 방향",
    context: "연락과 기록",
    actionNoun: "메모와 숫자",
    balanceNoun: "지출과 시간",
  },
  ox: {
    headlineSignal: "꾸준히 쌓아둔 일",
    context: "기존 업무와 약속",
    actionNoun: "마감과 확인",
    balanceNoun: "속도와 안정",
  },
  tiger: {
    headlineSignal: "먼저 움직이는 선택",
    context: "새 제안과 시작",
    actionNoun: "첫 단계",
    balanceNoun: "용기와 준비",
  },
  rabbit: {
    headlineSignal: "관계의 온도",
    context: "대화와 관계",
    actionNoun: "말의 순서",
    balanceNoun: "배려와 기준",
  },
  dragon: {
    headlineSignal: "크게 판을 보는 감각",
    context: "계획과 목표",
    actionNoun: "우선순위",
    balanceNoun: "확장과 정리",
  },
  snake: {
    headlineSignal: "숨은 조건",
    context: "계약과 판단",
    actionNoun: "조건 확인",
    balanceNoun: "직감과 근거",
  },
  horse: {
    headlineSignal: "속도가 붙는 일",
    context: "이동과 일정",
    actionNoun: "동선",
    balanceNoun: "추진력과 휴식",
  },
  goat: {
    headlineSignal: "마음 쓰이는 관계",
    context: "가족과 가까운 사람",
    actionNoun: "감정 정리",
    balanceNoun: "배려와 소진",
  },
  monkey: {
    headlineSignal: "빠르게 바뀌는 변수",
    context: "협업과 문제 해결",
    actionNoun: "대안",
    balanceNoun: "순발력과 집중",
  },
  rooster: {
    headlineSignal: "디테일의 차이",
    context: "문서와 발표",
    actionNoun: "표현과 검토",
    balanceNoun: "완성도와 여유",
  },
  dog: {
    headlineSignal: "지켜야 할 약속",
    context: "책임과 신뢰",
    actionNoun: "약속 시간",
    balanceNoun: "의리와 거리",
  },
  pig: {
    headlineSignal: "편하게 풀리는 흐름",
    context: "휴식과 회복",
    actionNoun: "컨디션",
    balanceNoun: "여유와 마무리",
  },
};

function buildDailyProfile(person: Person): DailyProfile {
  const [rawElement, rawBranch] = person.cardId.split("-");
  const element = isElement(rawElement) ? rawElement : elementFromBirthMonth(person.input.birthDate);
  const branch = isBranch(rawBranch) ? rawBranch : branchFromBirthDate(person.input.birthDate);
  const elementProfile = ELEMENT_DAILY_PROFILE[element];
  const branchProfile = BRANCH_DAILY_PROFILE[branch];
  return {
    ...elementProfile,
    ...branchProfile,
    cardName: `${ELEMENT_COLOR_KR[element]} ${BRANCH_LABEL_KR[branch]}`,
    timeLens: timeLensFromBirthTime(person.input.birthTime),
  };
}

function isElement(value?: string): value is Element {
  return !!value && (ELEMENTS as readonly string[]).includes(value);
}

function isBranch(value?: string): value is Branch {
  return !!value && (BRANCHES as readonly string[]).includes(value);
}

function elementFromBirthMonth(birthDate: string): Element {
  const month = Number(birthDate.split("-")[1]);
  if (!Number.isFinite(month)) return "earth";
  if (month === 3 || month === 6 || month === 9 || month === 12) return "earth";
  if (month >= 1 && month <= 2) return "wood";
  if (month >= 4 && month <= 5) return "fire";
  if (month >= 7 && month <= 8) return "metal";
  return "water";
}

function branchFromBirthDate(birthDate: string): Branch {
  const day = Number(birthDate.split("-")[2]);
  if (!Number.isFinite(day)) return "rabbit";
  return BRANCHES[Math.abs(day - 1) % BRANCHES.length];
}

function timeLensFromBirthTime(birthTime: string): string {
  if (birthTime === "자시" || birthTime === "축시" || birthTime === "해시") {
    return "조용한 시간대";
  }
  if (birthTime === "인시" || birthTime === "묘시" || birthTime === "진시") {
    return "오전 초반";
  }
  if (birthTime === "사시" || birthTime === "오시") {
    return "낮 시간";
  }
  if (birthTime === "미시" || birthTime === "신시") {
    return "오후 흐름";
  }
  if (birthTime === "유시" || birthTime === "술시") {
    return "저녁 전후";
  }
  return "컨디션이 또렷한 시간대";
}

function buildReturnTo({
  date,
  purpose,
  memo,
}: {
  date: string;
  purpose: PurposeKey;
  memo: string;
}): string {
  const params = new URLSearchParams({ date, purpose, paid: "1" });
  const trimmed = memo.trim();
  if (trimmed) params.set("memo", trimmed);
  return `/today?${params.toString()}`;
}

function dailyProductKey(person: Person, date: string, purpose: PurposeKey): string {
  return `daily:${sajuPersonKey(person.input)}:${date}:${purpose}`;
}

function isPurposeKey(value?: string): value is PurposeKey {
  return !!value && PURPOSES.some((item) => item.key === value);
}

function clampScore(value: number) {
  return Math.max(52, Math.min(98, value));
}

function pick<T>(items: T[], seed: number): T {
  return items[Math.abs(seed) % items.length];
}

function hash(value: string): number {
  let h = 0x811c9dc5;
  for (let i = 0; i < value.length; i += 1) {
    h ^= value.charCodeAt(i);
    h = Math.imul(h, 0x01000193);
  }
  return h >>> 0;
}

function kstDateISO(offsetDays = 0): string {
  const now = new Date();
  const utc = now.getTime() + now.getTimezoneOffset() * 60_000;
  const kst = new Date(utc + 9 * 60 * 60 * 1000 + offsetDays * 24 * 60 * 60 * 1000);
  const y = kst.getUTCFullYear();
  const m = String(kst.getUTCMonth() + 1).padStart(2, "0");
  const d = String(kst.getUTCDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

function nextKstDateISO(): string {
  return kstDateISO(1);
}

function formatDateShort(value: string): string {
  const [year, month, day] = value.split("-");
  if (!year || !month || !day) return value;
  return `${Number(month)}월 ${Number(day)}일`;
}

function readCookie(name: string): string | undefined {
  if (typeof document === "undefined") return undefined;
  const prefix = `${name}=`;
  return document.cookie
    .split(";")
    .map((item) => item.trim())
    .find((item) => item.startsWith(prefix))
    ?.slice(prefix.length);
}
