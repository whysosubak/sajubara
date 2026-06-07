#!/usr/bin/env node
// Checks launch-critical configuration without printing secret values.

import { promises as dns } from "node:dns";
import { existsSync, readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = join(__dirname, "..");

loadEnvFile(".env.local");

const errors = [];
const warnings = [];

function loadEnvFile(fileName) {
  const envPath = join(root, fileName);
  if (!existsSync(envPath)) return;

  const text = readFileSync(envPath, "utf-8");
  for (const line of text.split("\n")) {
    const match = line.match(/^([A-Z0-9_]+)=(.*)$/);
    if (!match || process.env[match[1]]) continue;
    process.env[match[1]] = match[2].replace(/^["']|["']$/g, "");
  }
}

function requireEnv(name) {
  if (!process.env[name]) errors.push(`Missing required env: ${name}`);
}

function warnEnv(name, message) {
  if (!process.env[name]) warnings.push(message ?? `Missing recommended env: ${name}`);
}

function checkFile(pathFromRoot) {
  if (!existsSync(join(root, pathFromRoot))) {
    errors.push(`Missing required file: ${pathFromRoot}`);
  }
}

async function checkDns(name, url) {
  if (!url) return;
  try {
    const host = new URL(url).hostname;
    await dns.lookup(host);
  } catch (error) {
    errors.push(`${name} does not resolve: ${url} (${error.code ?? error.message})`);
  }
}

function checkNoPublicLaunchPlaceholders() {
  const files = ["app/privacy/page.tsx", "app/terms/page.tsx", "app/refund/page.tsx"];
  for (const file of files) {
    const text = readFileSync(join(root, file), "utf-8");
    if (text.includes("실제 출시 전") || text.includes("Before public launch")) {
      errors.push(`Launch placeholder remains in ${file}`);
    }
  }
}

requireEnv("OPENAI_API_KEY");
requireEnv("NEXT_PUBLIC_SUPABASE_URL");
requireEnv("NEXT_PUBLIC_SUPABASE_ANON_KEY");
requireEnv("SUPABASE_SERVICE_ROLE_KEY");

warnEnv("OPENAI_MODEL_FULL", "OPENAI_MODEL_FULL is recommended; OPENAI_MODEL is only a legacy fallback.");
warnEnv("OPENAI_MODEL_LITE", "OPENAI_MODEL_LITE is recommended to keep lite report costs predictable.");
warnEnv("NEXT_PUBLIC_SITE_URL", "NEXT_PUBLIC_SITE_URL should be set to the final production domain.");
warnEnv("NEXT_PUBLIC_CHECKOUT_MODE", "NEXT_PUBLIC_CHECKOUT_MODE should be explicit: mock for beta, portone for live sales.");

const checkoutMode = process.env.NEXT_PUBLIC_CHECKOUT_MODE ?? "mock";
if (!["mock", "portone"].includes(checkoutMode)) {
  errors.push("NEXT_PUBLIC_CHECKOUT_MODE must be either mock or portone.");
}
if (checkoutMode === "portone") {
  requireEnv("NEXT_PUBLIC_PORTONE_STORE_ID");
  requireEnv("NEXT_PUBLIC_PORTONE_CHANNEL_KEY");
  requireEnv("PORTONE_API_SECRET");
  warnEnv("NEXT_PUBLIC_PORTONE_PAY_METHOD", "NEXT_PUBLIC_PORTONE_PAY_METHOD should be set, usually CARD.");
}

checkFile("app/robots.ts");
checkFile("app/sitemap.ts");
checkFile("app/api/health/route.ts");
checkFile("public/images/brand/capybara-glass-face.png");
checkFile("public/images/hero/capybara-yuzu-onsen-ai.png");
checkNoPublicLaunchPlaceholders();

await checkDns("NEXT_PUBLIC_SUPABASE_URL", process.env.NEXT_PUBLIC_SUPABASE_URL);

console.log("Launch audit");
console.log("============");
console.log(`Checkout mode: ${checkoutMode}`);
console.log(`Indexing: ${process.env.NEXT_PUBLIC_INDEX_SITE === "false" ? "disabled" : "enabled"}`);

if (warnings.length) {
  console.log("\nWarnings");
  for (const warning of warnings) console.log(`- ${warning}`);
}

if (errors.length) {
  console.log("\nErrors");
  for (const error of errors) console.log(`- ${error}`);
  process.exit(1);
}

console.log("\nOK: launch-critical local checks passed.");
