#!/usr/bin/env node
// Verify Supabase reports cache is reachable & writable.
// Usage: node scripts/verify-supabase.mjs

import { createClient } from "@supabase/supabase-js";
import { readFileSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const envPath = join(__dirname, "..", ".env.local");

function loadEnv() {
  try {
    const text = readFileSync(envPath, "utf-8");
    for (const line of text.split("\n")) {
      const m = line.match(/^([A-Z0-9_]+)=(.*)$/);
      if (m && !process.env[m[1]]) {
        process.env[m[1]] = m[2].replace(/^["']|["']$/g, "");
      }
    }
  } catch {
    // .env.local not found — rely on process.env
  }
}

loadEnv();

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const key = serviceKey || anonKey;
const usingServiceRole = !!serviceKey;

if (!url || !key) {
  console.error("❌ Missing NEXT_PUBLIC_SUPABASE_URL or anon key in .env.local");
  process.exit(1);
}

console.log(`→ Supabase URL: ${url}`);
console.log(`→ Using ${usingServiceRole ? "SERVICE ROLE" : "anon"} key\n`);

const client = createClient(url, key, { auth: { persistSession: false } });

async function main() {
  // 1) Connectivity: try a SELECT on reports
  const probe = await client.from("reports").select("cache_key").limit(1);
  if (probe.error) {
    const msg = probe.error.message || "";
    if (/relation .* does not exist/i.test(msg) || /Could not find the table/i.test(msg)) {
      const projectRef = new URL(url).hostname.split(".")[0];
      const sqlPath = join(__dirname, "..", "supabase", "migrations", "0001_reports.sql");
      console.log("⚠️  Table 'reports' not found.\n");
      console.log("    To enable persistent cache (huge cost savings for repeat visits):");
      console.log("    1) Open: https://supabase.com/dashboard/project/" + projectRef + "/sql/new");
      console.log("    2) Paste the SQL below and click Run");
      console.log("    3) Re-run: npm run db:verify\n");
      console.log("    ─── SQL (copy this) ───");
      try {
        const sql = readFileSync(sqlPath, "utf-8");
        sql.split("\n").forEach((line) => console.log("    " + line));
      } catch {
        console.log("    (SQL file missing at " + sqlPath + ")");
      }
      console.log("    ─── end ───\n");
      console.log("    Note: App works fine without this; you just lose persistent cache (tmpdir fallback active).");
      process.exit(2);
    }
    console.log("❌ SELECT failed:", msg);
    process.exit(3);
  }
  console.log(`✅ Table 'reports' exists (current row count probe ok, sample rows: ${probe.data?.length ?? 0})`);

  // 2) Write probe
  const testKey = `__verify_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
  const writeRes = await client
    .from("reports")
    .upsert(
      { cache_key: testKey, kind: "yearlyOverview", tier: "lite", data: { test: true } },
      { onConflict: "cache_key" },
    );
  if (writeRes.error) {
    console.log("❌ Write blocked:", writeRes.error.message);
    console.log("    RLS policies may need updating. See migrations/0001_reports.sql.");
    process.exit(4);
  }
  console.log(`✅ Insert ok (key=${testKey})`);

  // 3) Read-back
  const readBack = await client.from("reports").select("data").eq("cache_key", testKey).maybeSingle();
  if (readBack.error || !readBack.data) {
    console.log("❌ Read-back failed:", readBack.error?.message || "no rows");
    process.exit(5);
  }
  console.log(`✅ Read-back ok`);

  // 4) Cleanup
  const delRes = await client.from("reports").delete().eq("cache_key", testKey);
  if (delRes.error) {
    console.log(`⚠️  Cleanup failed (harmless): ${delRes.error.message}`);
  } else {
    console.log(`✅ Cleanup ok`);
  }

  console.log("\n🎉 Supabase reports cache is fully operational.");
  if (!usingServiceRole) {
    console.log("ℹ️  Currently using anon key. Add SUPABASE_SERVICE_ROLE_KEY to .env.local for production.");
  }
}

main().catch((e) => {
  console.error("❌ Unexpected error:", e?.message || e);
  process.exit(99);
});
