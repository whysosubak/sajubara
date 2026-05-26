"use client";

import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import AdditionalPersonAuthBoundary from "@/app/components/AdditionalPersonAuthBoundary";
import { YuzuIcon } from "@/app/components/capybara";
import { LS_LEGACY_INPUT, SECONDARY_RELATION_OPTIONS } from "@/lib/bara/people";
import type { Relation } from "@/lib/bara/people";
import {
  BIRTH_TIMES,
  JOB_STATUSES,
  LOVE_STATUSES,
  type CalendarType,
  type Gender,
  type JobStatus,
  type LoveStatus,
} from "@/lib/saju/types";

type InputFlow = "saju" | "daewoon" | "yearly";
type InputMode = "default" | "add-person";

const BARA_FACE_SRC = "/images/brand/capybara-glass-face.png";

const FLOW_COPY: Record<
  InputFlow,
  {
    eyebrow: string;
    title: string;
    hero: string;
    submit: string;
    note: string;
    destination: string;
  }
> = {
  saju: {
    eyebrow: "바라의 한 마디",
    title: "태어난 시간까지 알려주시면",
    hero: "더 정확하게 봐드릴 수 있어요 🛁",
    submit: "🛁 사주 보러 가기",
    note: "미리보기 단계 · 결제 없이 결과 확인",
    destination: "/saju/result",
  },
  daewoon: {
    eyebrow: "대운 해설 준비",
    title: "지금 들어온 10년 흐름을",
    hero: "생년월일시 기준으로 바로 풀어드릴게요 🌊",
    submit: "🌊 대운 해설 보기",
    note: "대운 미리보기 · 현재 10년 흐름 먼저 확인",
    destination: "/daewoon",
  },
  yearly: {
    eyebrow: "연도별 운세 준비",
    title: "올해와 앞으로의 흐름을",
    hero: "월별 운세까지 이어서 볼 수 있어요 📅",
    submit: "📅 연도별 운세 보기",
    note: "연도별 미리보기 · 올해 흐름 먼저 확인",
    destination: "/yearly",
  },
};

export default function SajuInputPage() {
  const router = useRouter();
  const [flow, setFlow] = useState<InputFlow>("saju");
  const [mode, setMode] = useState<InputMode>("default");
  const [name, setName] = useState("");
  const [relation, setRelation] = useState<Relation>("가족");
  const [birthDate, setBirthDate] = useState("");
  const [birthTime, setBirthTime] = useState<string>("모름");
  const [gender, setGender] = useState<Gender>("여");
  const [calendar, setCalendar] = useState<CalendarType>("양력");
  const [loveStatus, setLoveStatus] = useState<LoveStatus | "">("");
  const [jobStatus, setJobStatus] = useState<JobStatus | "">("");
  const [targetYear, setTargetYear] = useState("");
  const [targetDaewoonIndex, setTargetDaewoonIndex] = useState("");
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    /* eslint-disable react-hooks/set-state-in-effect */
    const sp = new URLSearchParams(window.location.search);
    const next = sp.get("next");
    const nextMode = sp.get("mode");
    if (next === "daewoon" || next === "yearly") {
      setFlow(next);
    }
    if (nextMode === "add-person") {
      setMode("add-person");
      setFlow("saju");
    }
    const nextName = sp.get("name");
    const nextRelation = sp.get("relation");
    const nextBirthDate = sp.get("birthDate");
    const nextBirthTime = sp.get("birthTime");
    const nextGender = sp.get("gender");
    const nextCalendar = sp.get("calendar");
    const nextLoveStatus = sp.get("loveStatus");
    const nextJobStatus = sp.get("jobStatus");
    const nextYear = sp.get("year");
    const nextIndex = sp.get("index");
    if (nextName) setName(nextName);
    if (nextRelation && (SECONDARY_RELATION_OPTIONS as readonly string[]).includes(nextRelation)) {
      setRelation(nextRelation as Relation);
    }
    if (nextBirthDate) setBirthDate(nextBirthDate);
    if (nextBirthTime) setBirthTime(nextBirthTime);
    if (nextGender === "남" || nextGender === "여") setGender(nextGender);
    if (nextCalendar === "양력" || nextCalendar === "음력") setCalendar(nextCalendar);
    if (nextLoveStatus && (LOVE_STATUSES as readonly string[]).includes(nextLoveStatus)) {
      setLoveStatus(nextLoveStatus as LoveStatus);
    }
    if (nextJobStatus && (JOB_STATUSES as readonly string[]).includes(nextJobStatus)) {
      setJobStatus(nextJobStatus as JobStatus);
    }
    if (nextYear && /^\d{4}$/.test(nextYear)) setTargetYear(nextYear);
    if (nextIndex && /^\d+$/.test(nextIndex)) setTargetDaewoonIndex(nextIndex);
    /* eslint-enable react-hooks/set-state-in-effect */
  }, []);

  function handleSubmit(e: React.SyntheticEvent<HTMLFormElement>) {
    e.preventDefault();
    if (!name.trim() || !birthDate) return;
    setSubmitting(true);
    const obj: Record<string, string> = {
      name: name.trim(),
      birthDate,
      birthTime,
      gender,
      calendar,
    };
    if (loveStatus) obj.loveStatus = loveStatus;
    if (jobStatus) obj.jobStatus = jobStatus;
    const params = new URLSearchParams(obj);
    if (mode === "add-person") params.set("relation", relation);
    if (flow === "daewoon" && targetDaewoonIndex) params.set("index", targetDaewoonIndex);
    try {
      localStorage.setItem(LS_LEGACY_INPUT, JSON.stringify(obj));
    } catch {
      // best-effort only
    }
    const destination =
      mode === "add-person" && flow === "saju"
        ? "/saju/preview"
        : flow === "yearly" && targetYear
          ? `/yearly/${targetYear}`
          : FLOW_COPY[flow].destination;
    router.push(`${destination}?${params.toString()}`);
  }

  const addPersonMode = mode === "add-person" && flow === "saju";
  const copy = addPersonMode
    ? {
        ...FLOW_COPY.saju,
        eyebrow: "다른 사람 사주 추가",
        title: "먼저 만세력만 확인하고",
        hero: "해석은 저장 후 990원으로 열어요 🌿",
        submit: "🔮 만세력 미리보기",
        note: "무료 미리보기 · 해석 본문은 결제 후 열림",
      }
    : FLOW_COPY[flow];
  const canSubmit = name.trim().length > 0 && birthDate.length > 0 && !submitting;

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
        <span className="inline-flex items-center gap-1 text-[11px] font-bold text-sb-terra-dark">
          <YuzuIcon size={14} /> 1 유자
        </span>
      </header>

      <AdditionalPersonAuthBoundary enabled={addPersonMode}>
        <div className="flex-1 overflow-y-auto">
        <section className="px-4 pt-2 pb-4">
          <div
            className="relative rounded-sb-xl overflow-hidden px-5 pt-5 pb-4"
            style={{
              background: "linear-gradient(170deg, #F0E4C2 0%, #E4D5A8 55%, #C9B27A 100%)",
              boxShadow: "var(--shadow-sb-hero), inset 0 1px 0 rgba(255,255,255,0.5)",
            }}
          >
            <div
              className="absolute pointer-events-none"
              style={{
                top: -40,
                right: -40,
                width: 180,
                height: 180,
                borderRadius: "50%",
                background:
                  "radial-gradient(circle, rgba(255,240,180,0.7) 0%, rgba(255,240,180,0) 70%)",
              }}
            />
            <div
              className="absolute inset-0 pointer-events-none"
              style={{
                opacity: 0.18,
                backgroundImage:
                  "radial-gradient(circle at 20% 30%, #8B5E3C 0.5px, transparent 1px), radial-gradient(circle at 70% 60%, #8B5E3C 0.5px, transparent 1px)",
                backgroundSize: "14px 14px, 22px 22px",
              }}
            />

            <div className="relative flex items-center gap-3">
              <div
                className="shrink-0 w-14 h-14 rounded-full flex items-center justify-center overflow-hidden"
                style={{
                  background: "rgba(255,253,245,0.72)",
                  boxShadow:
                    "0 5px 16px rgba(92,110,62,0.16), inset 0 0 0 1px rgba(255,255,255,0.72)",
                }}
              >
                <Image
                  src={BARA_FACE_SRC}
                  alt=""
                  width={80}
                  height={80}
                  className="h-[58px] w-[58px] object-cover scale-[1.08]"
                  aria-hidden
                  priority
                />
              </div>
              <div className="relative">
                <div className="text-[10.5px] font-bold text-sb-olive-light mb-0.5">
                  {copy.eyebrow}
                </div>
                <div className="text-[15px] font-extrabold text-sb-ink leading-snug tracking-tight">
                  {copy.title}
                  <br />
                  {copy.hero}
                </div>
              </div>
            </div>
          </div>
        </section>

        <form onSubmit={handleSubmit} className="px-4 flex flex-col gap-3 pb-8">
        <Field label="이름">
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="홍길동"
            maxLength={20}
            className="w-full bg-sb-paper rounded-sb-md px-4 py-3 text-[15px] text-sb-ink placeholder:text-sb-ink-3 outline-none focus:ring-2 focus:ring-sb-olive/50"
            style={{ boxShadow: "inset 0 0 0 1px var(--sb-hairline)" }}
          />
        </Field>

        {addPersonMode && (
          <Field label="관계">
            <div className="flex flex-wrap gap-1.5">
              {SECONDARY_RELATION_OPTIONS.map((r) => (
                <Chip
                  key={r}
                  active={relation === r}
                  onClick={() => setRelation(r)}
                  label={r}
                />
              ))}
            </div>
          </Field>
        )}

        <Field label="생년월일">
          <input
            type="date"
            value={birthDate}
            onChange={(e) => setBirthDate(e.target.value)}
            max={new Date().toISOString().slice(0, 10)}
            className="w-full bg-sb-paper rounded-sb-md px-4 py-3 text-[15px] text-sb-ink outline-none focus:ring-2 focus:ring-sb-olive/50"
            style={{ boxShadow: "inset 0 0 0 1px var(--sb-hairline)" }}
          />
        </Field>

        <Field label="양력 / 음력">
          <SegmentedControl
            value={calendar}
            onChange={setCalendar}
            options={[
              { value: "양력", label: "양력" },
              { value: "음력", label: "음력" },
            ]}
          />
        </Field>

        <Field label="태어난 시간">
          <select
            value={birthTime}
            onChange={(e) => setBirthTime(e.target.value)}
            className="w-full bg-sb-paper rounded-sb-md px-4 py-3 text-[15px] text-sb-ink outline-none focus:ring-2 focus:ring-sb-olive/50 appearance-none"
            style={{
              boxShadow: "inset 0 0 0 1px var(--sb-hairline)",
              backgroundImage:
                "url(\"data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='12' height='8' viewBox='0 0 12 8'><path d='M1 1l5 5 5-5' stroke='%238B7758' stroke-width='1.8' fill='none' stroke-linecap='round' stroke-linejoin='round'/></svg>\")",
              backgroundRepeat: "no-repeat",
              backgroundPosition: "right 16px center",
              paddingRight: 36,
            }}
          >
            {BIRTH_TIMES.map((t) => (
              <option key={t.value} value={t.value}>
                {t.label}
              </option>
            ))}
          </select>
        </Field>

        <Field label="성별">
          <SegmentedControl
            value={gender}
            onChange={setGender}
            options={[
              { value: "여", label: "여" },
              { value: "남", label: "남" },
            ]}
          />
        </Field>

        <div className="mt-1 mb-1 px-1">
          <p className="text-[10.5px] text-sb-ink-3 font-bold tracking-wider uppercase">
            상황 (선택) — 알려주면 해석이 더 정확해져요
          </p>
        </div>

        <Field label="연애 상태">
          <div className="flex flex-wrap gap-1.5">
            <Chip
              active={loveStatus === ""}
              onClick={() => setLoveStatus("")}
              label="선택 안 함"
            />
            {LOVE_STATUSES.map((s) => (
              <Chip
                key={s}
                active={loveStatus === s}
                onClick={() => setLoveStatus(s)}
                label={s}
              />
            ))}
          </div>
        </Field>

        <Field label="직업 상태">
          <div className="flex flex-wrap gap-1.5">
            <Chip
              active={jobStatus === ""}
              onClick={() => setJobStatus("")}
              label="선택 안 함"
            />
            {JOB_STATUSES.map((s) => (
              <Chip
                key={s}
                active={jobStatus === s}
                onClick={() => setJobStatus(s)}
                label={s}
              />
            ))}
          </div>
        </Field>

        <button
          type="submit"
          disabled={!canSubmit}
          className="mt-3 rounded-full py-3.5 text-[15px] font-extrabold tracking-tight active:scale-[0.99] transition-transform disabled:opacity-50"
          style={{
            background: canSubmit
              ? "linear-gradient(135deg, var(--sb-yuzu-light), var(--sb-yuzu) 60%, var(--sb-yuzu-dark))"
              : "var(--sb-cream-dark)",
            color: "var(--sb-olive-dark)",
            boxShadow: canSubmit
              ? "var(--shadow-sb-pop), inset 0 1px 0 rgba(255,255,255,0.4)"
              : "none",
          }}
        >
          {submitting ? "잠시만 기다려 주세요…" : copy.submit}
        </button>
        <p className="text-center text-[11px] text-sb-ink-3 mt-1">
          {copy.note}
        </p>
        </form>
        </div>
      </AdditionalPersonAuthBoundary>
    </>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="flex flex-col gap-1.5 px-1">
      <span className="text-[12px] font-bold text-sb-ink-2 tracking-tight">{label}</span>
      {children}
    </label>
  );
}

function Chip({
  label,
  active,
  onClick,
}: {
  label: string;
  active: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`px-3 py-1.5 rounded-full text-[12.5px] font-bold tracking-tight transition-all ${
        active ? "bg-sb-olive text-white" : "bg-sb-paper text-sb-ink-2"
      }`}
      style={
        active
          ? { boxShadow: "0 2px 6px rgba(92,110,62,0.3)" }
          : { boxShadow: "inset 0 0 0 1px var(--sb-hairline)" }
      }
    >
      {label}
    </button>
  );
}

function SegmentedControl<T extends string>({
  value,
  onChange,
  options,
}: {
  value: T;
  onChange: (next: T) => void;
  options: { value: T; label: string }[];
}) {
  return (
    <div
      className="flex p-1 rounded-sb-md bg-sb-paper"
      style={{ boxShadow: "inset 0 0 0 1px var(--sb-hairline)" }}
    >
      {options.map((opt) => {
        const active = opt.value === value;
        return (
          <button
            key={opt.value}
            type="button"
            onClick={() => onChange(opt.value)}
            className={`flex-1 py-2 rounded-[12px] text-[14px] font-bold tracking-tight transition-colors ${
              active ? "bg-sb-olive text-white" : "text-sb-ink-2"
            }`}
            style={active ? { boxShadow: "0 2px 6px rgba(92, 110, 62, 0.3)" } : undefined}
          >
            {opt.label}
          </button>
        );
      })}
    </div>
  );
}
