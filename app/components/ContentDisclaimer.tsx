"use client";

import Link from "next/link";
import { useI18n } from "./LanguageProvider";

type ContentDisclaimerProps = {
  compact?: boolean;
  className?: string;
};

export default function ContentDisclaimer({
  compact = false,
  className = "",
}: ContentDisclaimerProps) {
  const { t } = useI18n();

  return (
    <section
      className={`rounded-sb-lg bg-sb-paper ${compact ? "px-4 py-3" : "px-4 py-4"} ${className}`}
      style={{
        boxShadow: "var(--shadow-sb-card), inset 0 0 0 1px rgba(91,74,54,0.06)",
      }}
    >
      <div className="text-[10.5px] font-extrabold uppercase tracking-[0.14em] text-sb-olive-light">
        {t("disclaimer.title")}
      </div>
      <p className="mt-1.5 text-[11.5px] font-semibold leading-relaxed text-sb-ink-2">
        {t("disclaimer.body")}
      </p>
      <div className="mt-2 flex flex-wrap justify-center gap-x-3 gap-y-1 text-[10.5px] font-extrabold text-sb-ink-3">
        <Link href="/terms" className="underline underline-offset-2">
          {t("common.terms")}
        </Link>
        <Link href="/privacy" className="underline underline-offset-2">
          {t("common.privacy")}
        </Link>
        <Link href="/refund" className="underline underline-offset-2">
          {t("common.refund")}
        </Link>
      </div>
    </section>
  );
}
