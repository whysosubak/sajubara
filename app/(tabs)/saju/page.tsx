"use client";

import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import AdditionalPersonAuthBoundary from "@/app/components/AdditionalPersonAuthBoundary";
import { useI18n } from "@/app/components/LanguageProvider";
import LanguageSwitcher from "@/app/components/LanguageSwitcher";
import { YuzuIcon } from "@/app/components/capybara";
import type { TranslationKey } from "@/app/i18n";
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
    eyebrowKey: TranslationKey;
    titleKey: TranslationKey;
    heroKey: TranslationKey;
    heroIcon: string;
    submitKey: TranslationKey;
    submitIcon: string;
    noteKey: TranslationKey;
    destination: string;
  }
> = {
  saju: {
    eyebrowKey: "saju.flow.saju.eyebrow",
    titleKey: "saju.flow.saju.title",
    heroKey: "saju.flow.saju.hero",
    heroIcon: "🛁",
    submitKey: "saju.flow.saju.submit",
    submitIcon: "🛁",
    noteKey: "saju.flow.saju.note",
    destination: "/saju/result",
  },
  daewoon: {
    eyebrowKey: "saju.flow.daewoon.eyebrow",
    titleKey: "saju.flow.daewoon.title",
    heroKey: "saju.flow.daewoon.hero",
    heroIcon: "🌊",
    submitKey: "saju.flow.daewoon.submit",
    submitIcon: "🌊",
    noteKey: "saju.flow.daewoon.note",
    destination: "/daewoon",
  },
  yearly: {
    eyebrowKey: "saju.flow.yearly.eyebrow",
    titleKey: "saju.flow.yearly.title",
    heroKey: "saju.flow.yearly.hero",
    heroIcon: "📅",
    submitKey: "saju.flow.yearly.submit",
    submitIcon: "📅",
    noteKey: "saju.flow.yearly.note",
    destination: "/yearly",
  },
};

const ADD_PERSON_COPY = {
  ...FLOW_COPY.saju,
  eyebrowKey: "saju.flow.addPerson.eyebrow",
  titleKey: "saju.flow.addPerson.title",
  heroKey: "saju.flow.addPerson.hero",
  heroIcon: "🌿",
  submitKey: "saju.flow.addPerson.submit",
  submitIcon: "🔮",
  noteKey: "saju.flow.addPerson.note",
} satisfies (typeof FLOW_COPY)["saju"];

const BIRTH_TIME_LABEL_KEYS: Record<string, TranslationKey> = {
  모름: "saju.birthTime.unknownLabel",
  자시: "saju.birthTime.ja",
  축시: "saju.birthTime.chuk",
  인시: "saju.birthTime.in",
  묘시: "saju.birthTime.myo",
  진시: "saju.birthTime.jin",
  사시: "saju.birthTime.sa",
  오시: "saju.birthTime.o",
  미시: "saju.birthTime.mi",
  신시: "saju.birthTime.sin",
  유시: "saju.birthTime.yu",
  술시: "saju.birthTime.sul",
  해시: "saju.birthTime.hae",
};

const RELATION_LABEL_KEYS: Record<Relation, TranslationKey> = {
  본인: "saju.relation.self",
  배우자: "saju.relation.spouse",
  연인: "saju.relation.partner",
  가족: "saju.relation.family",
  친구: "saju.relation.friend",
  지인: "saju.relation.acquaintance",
  기타: "saju.relation.other",
};

const LOVE_STATUS_LABEL_KEYS: Record<LoveStatus, TranslationKey> = {
  솔로: "saju.love.single",
  "연애 중": "saju.love.dating",
  기혼: "saju.love.married",
};

const JOB_STATUS_LABEL_KEYS: Record<JobStatus, TranslationKey> = {
  직장인: "saju.job.employee",
  프리랜서: "saju.job.freelancer",
  학생: "saju.job.student",
  자영업: "saju.job.selfEmployed",
  무직: "saju.job.none",
};

export default function SajuInputPage() {
  const router = useRouter();
  const { t } = useI18n();
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
  const copy = addPersonMode ? ADD_PERSON_COPY : FLOW_COPY[flow];
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
          {t("common.back")}
        </Link>
        <div className="flex items-center gap-1.5">
          <LanguageSwitcher compact />
          <span className="inline-flex items-center gap-1 text-[11px] font-bold text-sb-terra-dark">
            <YuzuIcon size={14} /> {t("common.yuzu.one")}
          </span>
        </div>
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
                  {t(copy.eyebrowKey)}
                </div>
                <div className="text-[15px] font-extrabold text-sb-ink leading-snug tracking-tight">
                  {t(copy.titleKey)}
                  <br />
                  {t(copy.heroKey)} {copy.heroIcon}
                </div>
              </div>
            </div>
          </div>
        </section>

        <form onSubmit={handleSubmit} className="px-4 flex flex-col gap-3 pb-8">
        <Field label={t("saju.field.name")}>
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder={t("saju.placeholder.name")}
            maxLength={20}
            className="w-full bg-sb-paper rounded-sb-md px-4 py-3 text-[15px] text-sb-ink placeholder:text-sb-ink-3 outline-none focus:ring-2 focus:ring-sb-olive/50"
            style={{ boxShadow: "inset 0 0 0 1px var(--sb-hairline)" }}
          />
        </Field>

        {addPersonMode && (
          <Field label={t("saju.field.relation")}>
            <div className="flex flex-wrap gap-1.5">
              {SECONDARY_RELATION_OPTIONS.map((r) => (
                <Chip
                  key={r}
                  active={relation === r}
                  onClick={() => setRelation(r)}
                  label={t(RELATION_LABEL_KEYS[r])}
                />
              ))}
            </div>
          </Field>
        )}

        <Field label={t("saju.field.birthDate")}>
          <input
            type="date"
            value={birthDate}
            onChange={(e) => setBirthDate(e.target.value)}
            max={new Date().toISOString().slice(0, 10)}
            className="w-full bg-sb-paper rounded-sb-md px-4 py-3 text-[15px] text-sb-ink outline-none focus:ring-2 focus:ring-sb-olive/50"
            style={{ boxShadow: "inset 0 0 0 1px var(--sb-hairline)" }}
          />
        </Field>

        <Field label={t("saju.field.calendar")}>
          <SegmentedControl
            value={calendar}
            onChange={setCalendar}
            options={[
              { value: "양력", label: t("saju.calendar.solar") },
              { value: "음력", label: t("saju.calendar.lunar") },
            ]}
          />
        </Field>

        <Field label={t("saju.field.birthTime")}>
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
            {BIRTH_TIMES.map((time) => (
              <option key={time.value} value={time.value}>
                {BIRTH_TIME_LABEL_KEYS[time.value]
                  ? t(BIRTH_TIME_LABEL_KEYS[time.value])
                  : time.label}
              </option>
            ))}
          </select>
        </Field>

        <Field label={t("saju.field.gender")}>
          <SegmentedControl
            value={gender}
            onChange={setGender}
            options={[
              { value: "여", label: t("saju.gender.female") },
              { value: "남", label: t("saju.gender.male") },
            ]}
          />
        </Field>

        <div className="mt-1 mb-1 px-1">
          <p className="text-[10.5px] text-sb-ink-3 font-bold tracking-wider uppercase">
            {t("saju.optionalContext")}
          </p>
        </div>

        <Field label={t("saju.field.loveStatus")}>
          <div className="flex flex-wrap gap-1.5">
            <Chip
              active={loveStatus === ""}
              onClick={() => setLoveStatus("")}
              label={t("saju.option.none")}
            />
            {LOVE_STATUSES.map((s) => (
              <Chip
                key={s}
                active={loveStatus === s}
                onClick={() => setLoveStatus(s)}
                label={t(LOVE_STATUS_LABEL_KEYS[s])}
              />
            ))}
          </div>
        </Field>

        <Field label={t("saju.field.jobStatus")}>
          <div className="flex flex-wrap gap-1.5">
            <Chip
              active={jobStatus === ""}
              onClick={() => setJobStatus("")}
              label={t("saju.option.none")}
            />
            {JOB_STATUSES.map((s) => (
              <Chip
                key={s}
                active={jobStatus === s}
                onClick={() => setJobStatus(s)}
                label={t(JOB_STATUS_LABEL_KEYS[s])}
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
          {submitting ? t("common.wait") : `${copy.submitIcon} ${t(copy.submitKey)}`}
        </button>
        <p className="text-center text-[11px] text-sb-ink-3 mt-1">
          {t(copy.noteKey)}
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
