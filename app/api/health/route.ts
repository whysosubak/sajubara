import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

export function GET() {
  const checkoutMode = process.env.NEXT_PUBLIC_CHECKOUT_MODE === "portone" ? "portone" : "mock";
  const portoneReady =
    checkoutMode !== "portone" ||
    Boolean(
      process.env.NEXT_PUBLIC_PORTONE_STORE_ID &&
        process.env.NEXT_PUBLIC_PORTONE_CHANNEL_KEY &&
        process.env.PORTONE_API_SECRET,
    );

  const checks = {
    openai: Boolean(process.env.OPENAI_API_KEY),
    supabaseUrl: Boolean(process.env.NEXT_PUBLIC_SUPABASE_URL),
    supabaseAnonKey: Boolean(process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY),
    supabaseServiceRole: Boolean(process.env.SUPABASE_SERVICE_ROLE_KEY),
    checkoutMode,
    portoneReady,
    siteUrl: process.env.NEXT_PUBLIC_SITE_URL ?? null,
  };

  const ok =
    checks.openai &&
    checks.supabaseUrl &&
    checks.supabaseAnonKey &&
    checks.supabaseServiceRole &&
    portoneReady;

  return NextResponse.json(
    {
      ok,
      service: "sajubara",
      checks,
      checkedAt: new Date().toISOString(),
    },
    { status: ok ? 200 : 503 },
  );
}
