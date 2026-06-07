"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { Suspense, useState } from "react";
import LanguageSwitcher from "@/app/components/LanguageSwitcher";
import { useI18n } from "@/app/components/LanguageProvider";
import { createSupabaseBrowserClient } from "@/lib/supabase/client";

const BARA_FACE_SRC = "/images/brand/capybara-glass-face.png";
const NEXT_COOKIE = "sajubara_auth_next";
const NEXT_COOKIE_MAX_AGE_SECONDS = 10 * 60;
const AUTH_REQUEST_TIMEOUT_MS = 12_000;
const AUTH_REDIRECT_TIMEOUT_MS = 8_000;

function normalizeNextPath(value: string) {
  if (!value.startsWith("/") || value.startsWith("//")) return "/people";
  return value;
}

function rememberNextPath(value: string) {
  const safeNext = normalizeNextPath(value);
  const secure = window.location.protocol === "https:" ? "; Secure" : "";
  document.cookie = `${NEXT_COOKIE}=${encodeURIComponent(
    safeNext,
  )}; Max-Age=${NEXT_COOKIE_MAX_AGE_SECONDS}; Path=/; SameSite=Lax${secure}`;
  return safeNext;
}

function withTimeout<T>(promise: Promise<T>, timeoutMs: number, message: string) {
  let timeoutId: number | undefined;
  const timeout = new Promise<never>((_resolve, reject) => {
    timeoutId = window.setTimeout(() => reject(new Error(message)), timeoutMs);
  });

  return Promise.race([promise, timeout]).finally(() => {
    if (timeoutId !== undefined) window.clearTimeout(timeoutId);
  });
}

async function assertAuthPreflight(message: string) {
  const response = await withTimeout(
    fetch("/api/auth/preflight", { cache: "no-store" }),
    AUTH_REQUEST_TIMEOUT_MS,
    message,
  );

  if (!response.ok) throw new Error(message);
}

export default function LoginPage() {
  return (
    <Suspense fallback={null}>
      <LoginInner />
    </Suspense>
  );
}

function LoginInner() {
  const searchParams = useSearchParams();
  const { locale, t } = useI18n();
  const next = normalizeNextPath(searchParams.get("next") ?? "/people");

  const [email, setEmail] = useState("");
  const [status, setStatus] = useState<"idle" | "sending" | "sent" | "error">("idle");
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [providerLoading, setProviderLoading] = useState<string | null>(null);

  const envMissing =
    !process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  function authErrorMessage(error: unknown, fallback: string) {
    if (!(error instanceof Error)) return fallback;
    if (/failed to fetch|load failed|networkerror|timed out|timeout|enotfound/i.test(error.message)) {
      return t("auth.supabaseUnavailable");
    }
    return error.message || fallback;
  }

  async function signInWithGoogle() {
    setErrorMessage(null);
    setProviderLoading("google");
    try {
      await assertAuthPreflight(t("auth.supabaseUnavailable"));
      const supabase = createSupabaseBrowserClient();
      rememberNextPath(next);
      const redirectTo = `${window.location.origin}/auth/callback`;
      const currentUrl = window.location.href;
      const { data, error } = await withTimeout(
        supabase.auth.signInWithOAuth({
          provider: "google",
          options: { redirectTo, skipBrowserRedirect: true },
        }),
        AUTH_REQUEST_TIMEOUT_MS,
        t("auth.supabaseUnavailable"),
      );
      if (error) throw error;
      if (!data.url) throw new Error(t("auth.googleError"));
      window.location.assign(data.url);
      window.setTimeout(() => {
        if (window.location.href === currentUrl) {
          setProviderLoading(null);
          setErrorMessage(t("auth.supabaseUnavailable"));
        }
      }, AUTH_REDIRECT_TIMEOUT_MS);
    } catch (e) {
      setProviderLoading(null);
      setErrorMessage(authErrorMessage(e, t("auth.googleError")));
    }
  }

  async function signInWithEmail(e: React.SyntheticEvent<HTMLFormElement>) {
    e.preventDefault();
    if (!email.trim()) return;
    setErrorMessage(null);
    setStatus("sending");
    try {
      await assertAuthPreflight(t("auth.supabaseUnavailable"));
      const supabase = createSupabaseBrowserClient();
      rememberNextPath(next);
      const emailRedirectTo = `${window.location.origin}/auth/callback`;
      const { error } = await withTimeout(
        supabase.auth.signInWithOtp({
          email: email.trim(),
          options: { emailRedirectTo },
        }),
        AUTH_REQUEST_TIMEOUT_MS,
        t("auth.supabaseUnavailable"),
      );
      if (error) throw error;
      setStatus("sent");
    } catch (e) {
      setStatus("error");
      setErrorMessage(authErrorMessage(e, t("auth.emailError")));
    }
  }

  return (
    <div className="sb-app-shell h-dvh flex flex-col w-full max-w-[420px] mx-auto">
      <header className="flex items-center justify-between px-5 pt-3 pb-2 shrink-0">
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
        <span className="text-[15px] font-extrabold text-sb-olive-dark">
          {t("login.title")}
        </span>
        <LanguageSwitcher compact />
      </header>

      <div className="flex-1 overflow-y-auto px-5 pt-6 pb-8 flex flex-col items-center">
        <div
          className="w-20 h-20 rounded-full flex items-center justify-center mb-4 overflow-hidden"
          style={{
            background: "rgba(255,253,245,0.82)",
            boxShadow:
              "0 6px 20px rgba(92,110,62,0.16), inset 0 0 0 1px rgba(92,110,62,0.13)",
          }}
        >
          <img src={BARA_FACE_SRC} alt="" className="h-[72px] w-[72px] object-cover" aria-hidden />
        </div>
        <h1 className="text-[20px] font-extrabold text-sb-ink-2 tracking-tight mb-1.5 text-center">
          {t("login.welcome")}
        </h1>
        <p className="text-[13px] text-sb-ink-3 leading-relaxed text-center mb-7">
          {t("login.description").split("\n").map((line, index, lines) => (
            <span key={`${line}-${index}`}>
              {line}
              {index < lines.length - 1 && <br />}
            </span>
          ))}
        </p>

        {envMissing && (
          <div
            className="w-full rounded-sb-md p-3.5 mb-4 text-[12px] text-sb-terra-dark leading-relaxed"
            style={{
              background: "#FFE6A8",
              boxShadow: "inset 0 0 0 1px rgba(184,122,91,0.3)",
            }}
          >
            {t("login.envMissing")}
          </div>
        )}

        <button
          type="button"
          onClick={signInWithGoogle}
          disabled={providerLoading !== null || envMissing}
          className="w-full rounded-full bg-white text-sb-ink py-3.5 font-extrabold text-[14px] flex items-center justify-center gap-2 disabled:opacity-50"
          style={{ boxShadow: "0 2px 8px rgba(0,0,0,0.08), inset 0 0 0 1px rgba(91,74,54,0.12)" }}
        >
          <GoogleLogo />
          {providerLoading === "google" ? t("login.googleLoading") : t("login.google")}
        </button>

        <div className="w-full flex items-center gap-3 my-5">
          <div className="flex-1 border-t border-sb-hairline" />
          <span className="text-[11px] font-semibold text-sb-ink-3">{t("login.or")}</span>
          <div className="flex-1 border-t border-sb-hairline" />
        </div>

        {status === "sent" ? (
          <div
            className="w-full rounded-sb-md p-4 text-center"
            style={{
              background: "var(--sb-cream)",
              boxShadow: "inset 0 0 0 1px rgba(91,74,54,0.1)",
            }}
          >
            <div className="text-[24px] mb-1.5">📩</div>
            <p className="text-[13.5px] text-sb-ink font-bold mb-1">
              {t("login.emailSentTitle")}
            </p>
            <p className="text-[12px] text-sb-ink-2 leading-relaxed">
              {t("login.emailSentBody", { email }).split("\n").map((line, index, lines) => (
                <span key={`${line}-${index}`}>
                  {line}
                  {index < lines.length - 1 && <br />}
                </span>
              ))}
            </p>
          </div>
        ) : (
          <form onSubmit={signInWithEmail} className="w-full flex flex-col gap-2.5">
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder={t("login.emailPlaceholder")}
              required
              autoComplete="email"
              disabled={envMissing}
              className="w-full bg-sb-paper rounded-sb-md px-4 py-3 text-[15px] text-sb-ink placeholder:text-sb-ink-3 outline-none focus:ring-2 focus:ring-sb-olive/50 disabled:opacity-50"
              style={{ boxShadow: "inset 0 0 0 1px var(--sb-hairline)" }}
            />
            <button
              type="submit"
              disabled={status === "sending" || !email.trim() || envMissing}
              className="rounded-full bg-sb-olive text-white py-3 font-extrabold text-[14px] disabled:opacity-50"
              style={{ boxShadow: "0 2px 6px rgba(92,110,62,0.3)" }}
            >
              {status === "sending" ? t("login.emailSending") : t("login.emailSubmit")}
            </button>
          </form>
        )}

        {errorMessage && (
          <p className="text-[12px] text-sb-terra-dark mt-3 text-center leading-relaxed" role="status">
            {errorMessage}
          </p>
        )}

        <p className="text-[11px] text-sb-ink-3 leading-relaxed text-center mt-6 px-2">
          {t("login.consentPrefix")}{" "}
          <Link href="/terms" className="font-extrabold underline underline-offset-2">
            {t("common.terms")}
          </Link>
          {locale === "ko" ? "과 " : " and "}
          <Link href="/privacy" className="font-extrabold underline underline-offset-2">
            {t("common.privacy")}
          </Link>
          {t("login.consentSuffix")}
        </p>
      </div>
    </div>
  );
}

function GoogleLogo() {
  return (
    <svg width="16" height="16" viewBox="0 0 18 18" aria-hidden>
      <path
        d="M17.64 9.2c0-.64-.06-1.25-.16-1.84H9v3.49h4.84a4.14 4.14 0 01-1.8 2.72v2.26h2.92a8.78 8.78 0 002.68-6.63z"
        fill="#4285F4"
      />
      <path
        d="M9 18c2.43 0 4.47-.8 5.96-2.18l-2.92-2.26c-.8.54-1.83.86-3.04.86a5.27 5.27 0 01-4.96-3.66H1.02v2.33A8.99 8.99 0 009 18z"
        fill="#34A853"
      />
      <path
        d="M4.04 10.76A5.4 5.4 0 013.76 9c0-.61.1-1.2.28-1.76V4.91H1.02A9.01 9.01 0 000 9c0 1.45.35 2.82.96 4.04l3.08-2.28z"
        fill="#FBBC05"
      />
      <path
        d="M9 3.58c1.32 0 2.5.46 3.44 1.35l2.58-2.58A9 9 0 009 0a8.99 8.99 0 00-7.98 4.9l3.02 2.34A5.27 5.27 0 019 3.58z"
        fill="#EA4335"
      />
    </svg>
  );
}
