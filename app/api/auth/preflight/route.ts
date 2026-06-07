import { promises as dns } from "node:dns";
import { NextResponse } from "next/server";

export const runtime = "nodejs";

export async function GET() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!supabaseUrl || !supabaseAnonKey) {
    return NextResponse.json({ ok: false, reason: "missing-env" }, { status: 503 });
  }

  try {
    const host = new URL(supabaseUrl).hostname;
    await dns.lookup(host);
    return NextResponse.json({ ok: true });
  } catch (error) {
    const message = error instanceof Error ? error.message : "unknown";
    return NextResponse.json(
      { ok: false, reason: "supabase-unreachable", message },
      { status: 503 },
    );
  }
}
