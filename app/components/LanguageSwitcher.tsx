"use client";

import { IconLanguage } from "@tabler/icons-react";
import { LOCALES, type Locale } from "@/app/i18n";
import { useI18n } from "./LanguageProvider";

export default function LanguageSwitcher({ compact = false }: { compact?: boolean }) {
  const { locale, setLocale, t } = useI18n();

  return (
    <div
      className={`inline-flex items-center rounded-full bg-sb-paper ${
        compact ? "gap-0.5 p-1" : "gap-1 p-1 pr-1.5"
      }`}
      style={{
        boxShadow:
          "0 8px 18px rgba(91,74,54,0.12), inset 0 0 0 1px rgba(91,74,54,0.1)",
      }}
      aria-label={t("language.label")}
    >
      {!compact && <IconLanguage size={15} className="ml-1 text-sb-ink-3" aria-hidden />}
      {LOCALES.map((option) => (
        <LocaleButton
          key={option}
          locale={option}
          active={locale === option}
          compact={compact}
          onClick={() => setLocale(option)}
          label={option === "ko" ? t("language.ko") : t("language.en")}
        />
      ))}
    </div>
  );
}

function LocaleButton({
  locale,
  active,
  compact,
  onClick,
  label,
}: {
  locale: Locale;
  active: boolean;
  compact: boolean;
  onClick: () => void;
  label: string;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`rounded-full font-extrabold transition-colors ${
        compact ? "h-6 min-w-8 px-2 text-[10px]" : "h-7 min-w-10 px-2.5 text-[11px]"
      } ${active ? "bg-sb-olive text-white" : "text-sb-ink-3"}`}
      aria-pressed={active}
      aria-label={label}
    >
      {locale.toUpperCase()}
    </button>
  );
}
