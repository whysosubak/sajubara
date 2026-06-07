#!/usr/bin/env node
// Sync deployment environment variables to the linked Vercel project.
// Values are read from .env.local and passed through stdin so they are not
// exposed in shell arguments or logs.

import { spawn } from "node:child_process";
import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";

const envPath = join(process.cwd(), ".env.local");
const localEnv = parseEnvFile(envPath);

const vars = {
  OPENAI_API_KEY: localEnv.OPENAI_API_KEY,
  OPENAI_MODEL: localEnv.OPENAI_MODEL,
  OPENAI_MODEL_FULL:
    localEnv.OPENAI_MODEL_FULL ?? localEnv.OPENAI_MODEL ?? "gpt-4o",
  OPENAI_MODEL_LITE: localEnv.OPENAI_MODEL_LITE ?? "gpt-4o-mini",
  NEXT_PUBLIC_SITE_URL: localEnv.NEXT_PUBLIC_SITE_URL ?? "https://www.barasaju.com",
  NEXT_PUBLIC_INDEX_SITE: localEnv.NEXT_PUBLIC_INDEX_SITE ?? "true",
  NEXT_PUBLIC_SUPABASE_URL: localEnv.NEXT_PUBLIC_SUPABASE_URL,
  NEXT_PUBLIC_SUPABASE_ANON_KEY: localEnv.NEXT_PUBLIC_SUPABASE_ANON_KEY,
  SUPABASE_SERVICE_ROLE_KEY: localEnv.SUPABASE_SERVICE_ROLE_KEY,
  NEXT_PUBLIC_CHECKOUT_MODE: localEnv.NEXT_PUBLIC_CHECKOUT_MODE ?? "mock",
};

const targets = ["production"];

for (const [name, value] of Object.entries(vars)) {
  if (!value) {
    console.log(`skip ${name}: empty`);
    continue;
  }

  for (const target of targets) {
    await addEnv(name, value, target);
  }
}

function parseEnvFile(path) {
  if (!existsSync(path)) {
    throw new Error(`Missing ${path}`);
  }

  const env = {};
  const text = readFileSync(path, "utf8");
  for (const rawLine of text.split(/\r?\n/)) {
    const line = rawLine.trim();
    if (!line || line.startsWith("#")) continue;
    const match = line.match(/^([A-Z0-9_]+)=(.*)$/);
    if (!match) continue;
    env[match[1]] = unquote(match[2].trim());
  }
  return env;
}

function unquote(value) {
  if (
    (value.startsWith('"') && value.endsWith('"')) ||
    (value.startsWith("'") && value.endsWith("'"))
  ) {
    return value.slice(1, -1);
  }
  return value;
}

function addEnv(name, value, target) {
  return new Promise((resolve, reject) => {
    const child = spawn(
      "npx",
      ["vercel", "env", "add", name, target, "--yes", "--force"],
      {
        env: {
          ...process.env,
          PATH: `/opt/homebrew/opt/node@22/bin:${process.env.PATH ?? ""}`,
        },
        stdio: ["pipe", "pipe", "pipe"],
      },
    );

    let output = "";
    child.stdout.on("data", (chunk) => {
      output += chunk.toString();
    });
    child.stderr.on("data", (chunk) => {
      output += chunk.toString();
    });

    child.on("error", reject);
    child.on("close", (code) => {
      const sanitized = output
        .split(/\r?\n/)
        .filter((line) => line.trim())
        .filter((line) => !line.includes(value))
        .join("\n");

      if (code === 0) {
        console.log(`ok ${name} ${target}`);
        return resolve();
      }

      reject(
        new Error(
          `Failed to add ${name} to ${target} (exit ${code})\n${sanitized}`,
        ),
      );
    });

    child.stdin.end(value);
  });
}
