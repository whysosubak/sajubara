import "server-only";
import { createClient, type SupabaseClient } from "@supabase/supabase-js";

let cachedClient: SupabaseClient | null = null;
let clientUnavailable = false;

function getClient(): SupabaseClient | null {
  if (clientUnavailable) return null;
  if (cachedClient) return cachedClient;
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY ?? process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!url || !key) {
    clientUnavailable = true;
    return null;
  }
  cachedClient = createClient(url, key, {
    auth: { persistSession: false },
  });
  return cachedClient;
}

export type ReportKind =
  | "oneLiner"
  | "section"
  | "daewoonReport"
  | "yearlyOverview"
  | "yearDetail";

export async function getReport(cacheKey: string): Promise<string | null> {
  const client = getClient();
  if (!client) return null;
  try {
    const { data, error } = await client
      .from("reports")
      .select("data")
      .eq("cache_key", cacheKey)
      .maybeSingle();
    if (error) {
      // Table may not exist yet on dev; silently degrade.
      return null;
    }
    if (!data) return null;
    return typeof data.data === "string" ? data.data : JSON.stringify(data.data);
  } catch {
    return null;
  }
}

export async function saveReport(
  cacheKey: string,
  kind: ReportKind,
  tier: "lite" | "full",
  payload: string,
): Promise<void> {
  const client = getClient();
  if (!client) return;
  let dataJson: unknown = payload;
  try {
    dataJson = JSON.parse(payload);
  } catch {
    // store raw string when not JSON
  }
  try {
    await client
      .from("reports")
      .upsert(
        { cache_key: cacheKey, kind, tier, data: dataJson },
        { onConflict: "cache_key" },
      );
  } catch {
    // best-effort
  }
}
