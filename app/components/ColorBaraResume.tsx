"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { useI18n } from "@/app/components/LanguageProvider";
import {
  buildColorResultHref,
  getSelectedColorRecord,
  loadColorRecords,
  type ColorBaraRecord,
} from "@/lib/color/storage";

export default function ColorBaraResume() {
  const { locale, t } = useI18n();
  const [record, setRecord] = useState<ColorBaraRecord | null>(null);
  const [count, setCount] = useState(0);

  useEffect(() => {
    /* eslint-disable react-hooks/set-state-in-effect */
    const records = loadColorRecords();
    setCount(records.length);
    setRecord(getSelectedColorRecord());
    /* eslint-enable react-hooks/set-state-in-effect */
  }, []);

  if (!record) return null;

  const name = displayColorRecordName(record.name, locale);
  const coreColor = colorLabel(record.report.cheat, locale);
  const soulColor = colorLabel(record.report.soul, locale);
  const stageColor = colorLabel(record.report.stage, locale);
  const stageLabel =
    locale === "ko" ? record.report.stage.keyword : `Stage ${record.report.stage.number}`;
  const lunarLabel = locale === "ko"
    ? record.lunarLabel
    : `Lunar ${record.lunarMonth}/${record.lunarDay}`;

  return (
    <section
      className="mt-4 rounded-sb-lg bg-sb-paper px-4 py-4"
      style={{ boxShadow: "var(--shadow-sb-card), inset 0 0 0 1px rgba(91,74,54,0.06)" }}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <div className="text-[10.5px] font-extrabold tracking-[0.14em] uppercase text-sb-olive-light">
            {t("color.resume.eyebrow")}
          </div>
          <h2 className="mt-1 text-[17px] font-extrabold text-sb-ink tracking-tight">
            {name
              ? t("color.resume.title", { name })
              : t("color.resume.unnamedTitle")}
          </h2>
          <p className="mt-1.5 text-[12.5px] font-semibold leading-relaxed text-sb-ink-2">
            {t("color.resume.summary", { color: coreColor, stage: stageLabel })}
          </p>
        </div>
        <span
          className="shrink-0 rounded-full px-2.5 py-1 text-[10px] font-extrabold text-sb-olive-dark"
          style={{ background: "var(--sb-cream)" }}
        >
          {t("color.resume.count", { count })}
        </span>
      </div>

      <div className="mt-3 flex flex-wrap gap-1.5">
        <ColorMiniChip label={lunarLabel} color={record.report.soul.hex} />
        <ColorMiniChip
          label={t("color.resume.soul", { color: soulColor })}
          color={record.report.soul.hex}
        />
        <ColorMiniChip
          label={t("color.resume.stage", { color: stageColor })}
          color={record.report.stage.hex}
        />
      </div>

      <Link
        href={buildColorResultHref(record)}
        className="mt-4 flex items-center justify-center rounded-full bg-sb-olive px-4 py-3 text-[13px] font-extrabold text-white active:scale-[0.99] transition-transform"
      >
        {t("color.resume.cta")}
      </Link>
    </section>
  );
}

function ColorMiniChip({ label, color }: { label: string; color: string }) {
  return (
    <span
      className="inline-flex items-center gap-1.5 rounded-full px-2.5 py-1.5 text-[11px] font-bold text-sb-ink-2"
      style={{ background: "rgba(255,253,245,0.78)", boxShadow: "inset 0 0 0 1px rgba(91,74,54,0.08)" }}
    >
      <span className="h-2 w-2 rounded-full" style={{ background: color }} />
      {label}
    </span>
  );
}

function colorLabel(
  item: { color: string; colorKr: string },
  locale: "ko" | "en",
): string {
  return locale === "ko" ? item.colorKr : item.color;
}

function displayColorRecordName(name: string, locale: "ko" | "en"): string {
  const trimmed = name.trim();
  if (locale === "ko") {
    return trimmed === "이름 없는 사람" ? "" : trimmed;
  }
  if (!trimmed || trimmed === "당신" || trimmed === "이름 없는 사람") {
    return "";
  }
  return trimmed;
}
