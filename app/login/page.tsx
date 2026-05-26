"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { Suspense, useState } from "react";
import { createSupabaseBrowserClient } from "@/lib/supabase/client";

const BARA_FACE_SRC = "/images/brand/capybara-glass-face.png";

export default function LoginPage() {
  return (
    <Suspense fallback={null}>
      <LoginInner />
    </Suspense>
  );
}

function LoginInner() {
  const searchParams = useSearchParams();
  const next = searchParams.get("next") ?? "/people";

  const [email, setEmail] = useState("");
  const [status, setStatus] = useState<"idle" | "sending" | "sent" | "error">("idle");
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [providerLoading, setProviderLoading] = useState<string | null>(null);

  const envMissing =
    !process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  async function signInWithGoogle() {
    setErrorMessage(null);
    setProviderLoading("google");
    try {
      const supabase = createSupabaseBrowserClient();
      const redirectTo = `${window.location.origin}/auth/callback?next=${encodeURIComponent(next)}`;
      const { error } = await supabase.auth.signInWithOAuth({
        provider: "google",
        options: { redirectTo },
      });
      if (error) throw error;
      // OAuth redirects browser, so we typically don't reach here.
    } catch (e) {
      setProviderLoading(null);
      setErrorMessage(
        e instanceof Error ? e.message : "Google 로그인 중 문제가 생겼어요.",
      );
    }
  }

  async function signInWithEmail(e: React.SyntheticEvent<HTMLFormElement>) {
    e.preventDefault();
    if (!email.trim()) return;
    setErrorMessage(null);
    setStatus("sending");
    try {
      const supabase = createSupabaseBrowserClient();
      const emailRedirectTo = `${window.location.origin}/auth/callback?next=${encodeURIComponent(next)}`;
      const { error } = await supabase.auth.signInWithOtp({
        email: email.trim(),
        options: { emailRedirectTo },
      });
      if (error) throw error;
      setStatus("sent");
    } catch (e) {
      setStatus("error");
      setErrorMessage(
        e instanceof Error ? e.message : "이메일 전송 중 문제가 생겼어요.",
      );
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
          뒤로
        </Link>
        <span className="text-[15px] font-extrabold text-sb-olive-dark">로그인</span>
        <div className="w-9" />
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
          사주바라에 오신 걸 환영해요
        </h1>
        <p className="text-[13px] text-sb-ink-3 leading-relaxed text-center mb-7">
          가족·친구·연인 사주를 함께 등록하려면
          <br />
          로그인이 필요해요.
        </p>

        {envMissing && (
          <div
            className="w-full rounded-sb-md p-3.5 mb-4 text-[12px] text-sb-terra-dark leading-relaxed"
            style={{
              background: "#FFE6A8",
              boxShadow: "inset 0 0 0 1px rgba(184,122,91,0.3)",
            }}
          >
            ⚠️ Supabase 환경변수가 아직 설정 안 됐어요. 콘솔에서 NEXT_PUBLIC_SUPABASE_URL,
            NEXT_PUBLIC_SUPABASE_ANON_KEY 등록 후 dev 서버를 재시작해 주세요.
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
          {providerLoading === "google" ? "이동 중…" : "Google로 시작하기"}
        </button>

        <div className="w-full flex items-center gap-3 my-5">
          <div className="flex-1 border-t border-sb-hairline" />
          <span className="text-[11px] font-semibold text-sb-ink-3">또는</span>
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
            <p className="text-[13.5px] text-sb-ink font-bold mb-1">메일을 보냈어요</p>
            <p className="text-[12px] text-sb-ink-2 leading-relaxed">
              <strong>{email}</strong> 메일함을 확인하고
              <br />
              로그인 링크를 눌러 주세요.
            </p>
          </div>
        ) : (
          <form onSubmit={signInWithEmail} className="w-full flex flex-col gap-2.5">
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="이메일 주소"
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
              {status === "sending" ? "보내는 중…" : "이메일로 로그인 링크 받기"}
            </button>
          </form>
        )}

        {errorMessage && (
          <p className="text-[12px] text-sb-terra-dark mt-3 text-center leading-relaxed">
            {errorMessage}
          </p>
        )}

        <p className="text-[11px] text-sb-ink-3 leading-relaxed text-center mt-6 px-2">
          계속 진행하면{" "}
          <Link href="/terms" className="font-extrabold underline underline-offset-2">
            이용약관
          </Link>
          과{" "}
          <Link href="/privacy" className="font-extrabold underline underline-offset-2">
            개인정보처리방침
          </Link>
          에 동의하는 것으로 간주됩니다.
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
