"use client";

import { usePathname } from "next/navigation";
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";
import {
  DEFAULT_LOCALE,
  LOCALE_COOKIE,
  LOCALE_STORAGE_KEY,
  type Locale,
  type TranslationKey,
  isLocale,
  translate,
} from "@/app/i18n";

type LanguageContextValue = {
  locale: Locale;
  setLocale: (next: Locale) => void;
  t: (key: TranslationKey, vars?: Record<string, string | number>) => string;
};

const LanguageContext = createContext<LanguageContextValue | null>(null);

export function LanguageProvider({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const [locale, setLocaleState] = useState<Locale>(DEFAULT_LOCALE);

  useEffect(() => {
    let timeout: number | undefined;
    try {
      const saved = localStorage.getItem(LOCALE_STORAGE_KEY);
      if (isLocale(saved)) {
        timeout = window.setTimeout(() => setLocaleState(saved), 0);
      }
    } catch {
      // Storage can be unavailable in private browsing modes.
    }
    return () => {
      if (timeout !== undefined) window.clearTimeout(timeout);
    };
  }, []);

  useEffect(() => {
    const updateDocumentMeta = () => {
      document.documentElement.lang = locale;
      document.title = documentTitle(pathname, locale);
    };

    updateDocumentMeta();
    const timeout = window.setTimeout(updateDocumentMeta, 80);

    return () => window.clearTimeout(timeout);
  }, [locale, pathname]);

  useEffect(() => {
    document.documentElement.lang = locale;
  }, [locale]);

  const setLocale = useCallback((next: Locale) => {
    setLocaleState(next);
    try {
      localStorage.setItem(LOCALE_STORAGE_KEY, next);
    } catch {
      // Best effort only.
    }
    const secure = window.location.protocol === "https:" ? "; Secure" : "";
    document.cookie = `${LOCALE_COOKIE}=${next}; Max-Age=31536000; Path=/; SameSite=Lax${secure}`;
  }, []);

  const value = useMemo<LanguageContextValue>(
    () => ({
      locale,
      setLocale,
      t: (key, vars) => translate(locale, key, vars),
    }),
    [locale, setLocale],
  );

  return <LanguageContext.Provider value={value}>{children}</LanguageContext.Provider>;
}

function documentTitle(pathname: string | null, locale: Locale): string {
  const path = pathname ?? "/";
  if (locale === "en") {
    if (path.startsWith("/terms")) return "Terms of Service | BaraSaju";
    if (path.startsWith("/privacy")) return "Privacy Policy | BaraSaju";
    if (path.startsWith("/refund")) return "Refund and Withdrawal Policy | BaraSaju";
    if (path.startsWith("/today")) return "Today’s Fortune | BaraSaju";
    if (path.startsWith("/people")) return "Manage Saju Profiles | BaraSaju";
    if (path.startsWith("/charge")) return "Top Up | BaraSaju";
    if (path.startsWith("/color")) return "Color Bara | BaraSaju";
    if (path.startsWith("/login")) return "Log in | BaraSaju";
    if (path.startsWith("/my")) return "Archive | BaraSaju";
    return "BaraSaju - Warm, clear fortune reports";
  }

  if (path.startsWith("/terms")) return "이용약관 | 바라사주";
  if (path.startsWith("/privacy")) return "개인정보처리방침 | 바라사주";
  if (path.startsWith("/refund")) return "환불 및 청약철회 정책 | 바라사주";
  return "바라사주 — 바라가 봐주면 다 맞아~";
}

export function useI18n() {
  const value = useContext(LanguageContext);
  if (!value) {
    throw new Error("useI18n must be used inside LanguageProvider");
  }
  return value;
}

export function T({
  k,
  vars,
  preserveLines = false,
}: {
  k: TranslationKey;
  vars?: Record<string, string | number>;
  preserveLines?: boolean;
}) {
  const { t } = useI18n();
  const text = t(k, vars);

  if (!preserveLines) return <>{text}</>;

  return (
    <>
      {text.split("\n").map((line, index, lines) => (
        <span key={`${line}-${index}`}>
          {line}
          {index < lines.length - 1 && <br />}
        </span>
      ))}
    </>
  );
}

export function LocalizedValue({
  ko,
  en,
}: {
  ko: React.ReactNode;
  en: React.ReactNode;
}) {
  const { locale } = useI18n();
  return <>{locale === "ko" ? ko : en}</>;
}
