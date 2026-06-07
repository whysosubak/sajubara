import { NextResponse, type NextRequest } from "next/server";
import { cookies } from "next/headers";
import { createSupabaseServerClient } from "@/lib/supabase/server";

const NEXT_COOKIE = "barasaju_auth_next";

function normalizeNextPath(value: string | null | undefined) {
  if (!value || !value.startsWith("/") || value.startsWith("//")) return "/people";
  return value;
}

function safeDecodeURIComponent(value: string | undefined) {
  if (!value) return undefined;
  try {
    return decodeURIComponent(value);
  } catch {
    return undefined;
  }
}

export async function GET(request: NextRequest) {
  const url = new URL(request.url);
  const code = url.searchParams.get("code");
  const cookieStore = await cookies();
  const savedNext = safeDecodeURIComponent(cookieStore.get(NEXT_COOKIE)?.value);
  const next = normalizeNextPath(url.searchParams.get("next") ?? savedNext);

  if (code) {
    const supabase = await createSupabaseServerClient();
    await supabase.auth.exchangeCodeForSession(code);
  }

  const response = NextResponse.redirect(new URL(next, url.origin));
  response.cookies.set(NEXT_COOKIE, "", { path: "/", maxAge: 0 });
  return response;
}
