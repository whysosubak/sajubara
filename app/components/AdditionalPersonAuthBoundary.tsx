"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { loadPeople } from "@/lib/bara/people";
import { createSupabaseBrowserClient } from "@/lib/supabase/client";
import { useI18n } from "./LanguageProvider";

type AuthStatus = "checking" | "allowed" | "redirecting";

export default function AdditionalPersonAuthBoundary({
  children,
  enabled,
  nextPath,
}: {
  children: React.ReactNode;
  enabled: boolean;
  nextPath?: string;
}) {
  const router = useRouter();
  const { t } = useI18n();
  const [status, setStatus] = useState<AuthStatus>(enabled ? "checking" : "allowed");

  useEffect(() => {
    let active = true;

    async function check() {
      if (!enabled) {
        if (active) setStatus("allowed");
        return;
      }

      setStatus("checking");

      const people = loadPeople();
      if (people.length === 0) {
        if (active) setStatus("allowed");
        return;
      }

      const currentPath =
        nextPath ?? `${window.location.pathname}${window.location.search}${window.location.hash}`;
      const loginHref = `/login?next=${encodeURIComponent(currentPath)}`;
      const envMissing =
        !process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

      if (envMissing) {
        if (active) setStatus("redirecting");
        router.replace(loginHref);
        return;
      }

      try {
        const supabase = createSupabaseBrowserClient();
        const { data } = await supabase.auth.getUser();
        if (!active) return;
        if (data.user) {
          setStatus("allowed");
        } else {
          setStatus("redirecting");
          router.replace(loginHref);
        }
      } catch {
        if (!active) return;
        setStatus("redirecting");
        router.replace(loginHref);
      }
    }

    void check();
    return () => {
      active = false;
    };
  }, [enabled, nextPath, router]);

  if (status === "allowed") return <>{children}</>;

  return (
    <div className="flex-1 overflow-y-auto px-4 pt-6">
      <section
        className="rounded-sb-xl bg-sb-paper px-5 py-7 text-center"
        style={{ boxShadow: "var(--shadow-sb-card), inset 0 0 0 1px rgba(91,74,54,0.06)" }}
      >
        <div
          className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-full text-[22px]"
          style={{
            background: "var(--sb-cream)",
            boxShadow: "inset 0 0 0 1px var(--sb-hairline)",
          }}
        >
          🔐
        </div>
        <h1 className="text-[17px] font-extrabold text-sb-ink tracking-tight">
          {t("authBoundary.title")}
        </h1>
        <p className="mt-2 text-[13px] leading-relaxed text-sb-ink-2">
          {t("authBoundary.description")}
          {status === "redirecting" ? t("authBoundary.redirecting") : ""}
        </p>
      </section>
    </div>
  );
}
