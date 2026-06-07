"use client";

import Link from "next/link";
import { useState } from "react";
import ColorBaraResume from "@/app/components/ColorBaraResume";
import { useI18n } from "@/app/components/LanguageProvider";
import LanguageSwitcher from "@/app/components/LanguageSwitcher";

const MONTHS = Array.from({ length: 12 }, (_, i) => i + 1);
const DAYS = Array.from({ length: 30 }, (_, i) => i + 1);
const SELECT_CHEVRON =
  "url(\"data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='12' height='8' viewBox='0 0 12 8'><path d='M1 1l5 5 5-5' stroke='%238B7758' stroke-width='1.8' fill='none' stroke-linecap='round' stroke-linejoin='round'/></svg>\")";

export default function ColorBaraPage() {
  const { t } = useI18n();
  const [calendar, setCalendar] = useState<"lunar" | "solar">("lunar");

  return (
    <>
      <header
        className="flex items-center justify-between px-5 pt-3 pb-3 shrink-0"
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
          <BackIcon />
          {t("common.home")}
        </Link>
        <span className="text-[15px] font-extrabold text-sb-olive-dark tracking-tight">
          {t("color.title")}
        </span>
        <div className="flex items-center gap-1.5">
          <LanguageSwitcher compact />
          <span
            className="h-9 px-3 rounded-full flex items-center text-[10px] font-extrabold text-sb-olive-dark"
            style={{
              background: "var(--sb-cream)",
              boxShadow: "inset 0 0 0 1px var(--sb-hairline)",
            }}
          >
            {t("common.free")}
          </span>
        </div>
      </header>

      <div className="flex-1 overflow-y-auto px-4 pt-4 pb-8">
        <section
          className="relative overflow-hidden rounded-sb-xl px-5 pt-6 pb-5"
          style={{
            background:
              "radial-gradient(circle at 18% 18%, rgba(242,167,185,0.55), transparent 34%), radial-gradient(circle at 78% 24%, rgba(229,200,77,0.5), transparent 30%), linear-gradient(145deg, #F9F0DC 0%, #E5EBCF 52%, #D8E6EA 100%)",
            boxShadow: "var(--shadow-sb-hero), inset 0 1px 0 rgba(255,255,255,0.58)",
          }}
        >
          <div className="relative z-10">
            <div className="text-[10.5px] font-extrabold tracking-[0.16em] uppercase text-sb-olive-light mb-2">
              {t("color.hero.eyebrow")}
            </div>
            <h1 className="text-[26px] font-extrabold text-sb-ink leading-tight tracking-tight">
              {t("color.hero.title").split("\n").map((line, index, lines) => (
                <span key={`${line}-${index}`}>
                  {line}
                  {index < lines.length - 1 && <br />}
                </span>
              ))}
            </h1>
            <p className="mt-3 max-w-[270px] text-[13px] font-semibold text-sb-ink-2 leading-relaxed">
              {t("color.hero.description")}
            </p>
          </div>

          <div className="mt-5 grid grid-cols-4 gap-2" aria-hidden>
            {["#8FBF7A", "#E97866", "#D9B75F", "#6D91C6"].map((color, i) => (
              <div
                key={color}
                className="h-12 rounded-[16px]"
                style={{
                  background: color,
                  opacity: 0.72,
                  boxShadow: "inset 0 1px 0 rgba(255,255,255,0.55), 0 4px 12px rgba(91,74,54,0.12)",
                  transform: `translateY(${i % 2 === 0 ? 0 : 8}px)`,
                }}
              />
            ))}
          </div>
        </section>

        <ColorBaraResume />

        <form action="/color/result" className="mt-4 flex flex-col gap-3">
          <Field label={t("color.field.name")}>
            <input
              name="name"
              type="text"
              maxLength={20}
              placeholder={t("color.placeholder.name")}
              className="w-full bg-sb-paper rounded-sb-md px-4 py-3 text-[15px] text-sb-ink placeholder:text-sb-ink-3 outline-none focus:ring-2 focus:ring-sb-olive/50"
              style={{ boxShadow: "inset 0 0 0 1px var(--sb-hairline)" }}
            />
          </Field>

          <Field label={t("color.field.calendar")}>
            <select
              name="calendar"
              value={calendar}
              onChange={(e) => setCalendar(e.target.value === "solar" ? "solar" : "lunar")}
              className="w-full appearance-none bg-sb-paper rounded-sb-md px-4 py-3 pr-11 text-[15px] text-sb-ink outline-none focus:ring-2 focus:ring-sb-olive/50"
              style={{
                boxShadow: "inset 0 0 0 1px var(--sb-hairline)",
                backgroundImage: SELECT_CHEVRON,
                backgroundRepeat: "no-repeat",
                backgroundPosition: "right 18px center",
                backgroundSize: "12px 8px",
              }}
            >
              <option value="lunar">{t("saju.calendar.lunar")}</option>
              <option value="solar">{t("saju.calendar.solar")}</option>
            </select>
            <p className="px-1 text-[11px] font-semibold leading-relaxed text-sb-ink-3">
              {t("color.calendarHelp")}
            </p>
          </Field>

          {calendar === "solar" ? (
            <Field label={t("color.field.solarDate")}>
              <input
                name="solarDate"
                type="date"
                required
                max={new Date().toISOString().slice(0, 10)}
                className="w-full bg-sb-paper rounded-sb-md px-4 py-3 text-[15px] text-sb-ink outline-none focus:ring-2 focus:ring-sb-olive/50"
                style={{ boxShadow: "inset 0 0 0 1px var(--sb-hairline)" }}
              />
            </Field>
          ) : (
            <div className="grid grid-cols-2 gap-2">
              <Field label={t("color.field.lunarMonth")}>
                <select
                  name="month"
                  defaultValue="5"
                  className="w-full appearance-none bg-sb-paper rounded-sb-md px-4 py-3 pr-11 text-[15px] text-sb-ink outline-none focus:ring-2 focus:ring-sb-olive/50"
                  style={{
                    boxShadow: "inset 0 0 0 1px var(--sb-hairline)",
                    backgroundImage: SELECT_CHEVRON,
                    backgroundRepeat: "no-repeat",
                    backgroundPosition: "right 16px center",
                    backgroundSize: "12px 8px",
                  }}
                >
                  {MONTHS.map((month) => (
                    <option key={month} value={month}>
                      {t("color.monthSuffix", { value: month })}
                    </option>
                  ))}
                </select>
              </Field>

              <Field label={t("color.field.lunarDay")}>
                <select
                  name="day"
                  defaultValue="17"
                  className="w-full appearance-none bg-sb-paper rounded-sb-md px-4 py-3 pr-11 text-[15px] text-sb-ink outline-none focus:ring-2 focus:ring-sb-olive/50"
                  style={{
                    boxShadow: "inset 0 0 0 1px var(--sb-hairline)",
                    backgroundImage: SELECT_CHEVRON,
                    backgroundRepeat: "no-repeat",
                    backgroundPosition: "right 16px center",
                    backgroundSize: "12px 8px",
                  }}
                >
                  {DAYS.map((day) => (
                    <option key={day} value={day}>
                      {t("color.daySuffix", { value: day })}
                    </option>
                  ))}
                </select>
              </Field>
            </div>
          )}

          <button
            type="submit"
            className="mt-2 rounded-full py-3.5 text-[15px] font-extrabold tracking-tight active:scale-[0.99] transition-transform"
            style={{
              background:
                "linear-gradient(135deg, var(--sb-yuzu-light), var(--sb-yuzu) 60%, var(--sb-yuzu-dark))",
              color: "var(--sb-olive-dark)",
              boxShadow: "var(--shadow-sb-pop), inset 0 1px 0 rgba(255,255,255,0.4)",
            }}
          >
            🎨 {t("color.submit")}
          </button>
          <p className="text-center text-[11px] text-sb-ink-3">
            {t("color.note")}
          </p>
        </form>
      </div>
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

function BackIcon() {
  return (
    <svg
      width="12"
      height="12"
      viewBox="0 0 12 12"
      fill="none"
      aria-hidden
      className="shrink-0 -ml-0.5 translate-y-[0.5px]"
    >
      <path
        d="M7.2 3L4.2 6L7.2 9"
        stroke="var(--sb-ink-2)"
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}
