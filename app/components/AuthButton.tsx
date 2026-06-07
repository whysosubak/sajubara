"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { createSupabaseBrowserClient } from "@/lib/supabase/client";
import { useI18n } from "./LanguageProvider";

export default function AuthButton() {
  const { t } = useI18n();
  const [email, setEmail] = useState<string | null>(null);
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    /* eslint-disable react-hooks/set-state-in-effect */
    setHydrated(true);
    if (
      !process.env.NEXT_PUBLIC_SUPABASE_URL ||
      !process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
    ) {
      return;
    }
    const supabase = createSupabaseBrowserClient();
    supabase.auth
      .getUser()
      .then(({ data }) => {
        setEmail(data.user?.email ?? null);
      })
      .catch(() => {
        setEmail(null);
      });
    const { data: sub } = supabase.auth.onAuthStateChange((_event, session) => {
      setEmail(session?.user.email ?? null);
    });
    /* eslint-enable react-hooks/set-state-in-effect */
    return () => sub.subscription.unsubscribe();
  }, []);

  // SSR fallback: render shell so layout doesn't shift
  if (!hydrated) {
    return (
      <span
        className="h-8 px-3 rounded-full bg-sb-paper text-[12px] font-bold text-sb-ink-2 inline-flex items-center gap-1"
        style={{ boxShadow: "inset 0 0 0 1px var(--sb-hairline)" }}
      >
        {t("auth.signedOut")}
      </span>
    );
  }

  if (email) {
    const handle = email.split("@")[0].slice(0, 10);
    return (
      <Link
        href="/my"
        className="h-8 px-3 rounded-full bg-sb-paper text-[12px] font-bold text-sb-ink-2 inline-flex items-center gap-1"
        style={{ boxShadow: "inset 0 0 0 1px var(--sb-hairline)" }}
      >
        {handle}
        <svg width="10" height="10" viewBox="0 0 10 10" fill="none" aria-hidden>
          <path
            d="M3.5 2L6.5 5L3.5 8"
            stroke="var(--sb-ink-3)"
            strokeWidth="1.5"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      </Link>
    );
  }

  return (
    <Link
      href="/login"
      className="h-8 px-3 rounded-full bg-sb-paper text-[12px] font-bold text-sb-ink-2 inline-flex items-center gap-1"
      style={{ boxShadow: "inset 0 0 0 1px var(--sb-hairline)" }}
    >
      {t("auth.signedOut")}
      <svg width="10" height="10" viewBox="0 0 10 10" fill="none" aria-hidden>
        <path
          d="M3.5 2L6.5 5L3.5 8"
          stroke="var(--sb-ink-3)"
          strokeWidth="1.5"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
    </Link>
  );
}
