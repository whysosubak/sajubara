import type { ColorNumerologyReport } from "@/lib/color/numerology";

export type ColorCalendar = "lunar" | "solar";

export type ColorBaraRecord = {
  id: string;
  name: string;
  calendar: ColorCalendar;
  solarDate?: string;
  lunarMonth: number;
  lunarDay: number;
  sourceLabel: string;
  lunarLabel: string;
  report: ColorNumerologyReport;
  createdAt: number;
  updatedAt: number;
};

export const LS_COLOR_RECORDS = "barasaju:colorRecords";
export const LS_SELECTED_COLOR_RECORD = "barasaju:selectedColorRecordId";

const MAX_RECORDS = 12;

type SaveColorRecordInput = {
  name?: string;
  calendar: ColorCalendar;
  solarDate?: string;
  lunarMonth: number;
  lunarDay: number;
  sourceLabel: string;
  lunarLabel: string;
  report: ColorNumerologyReport;
};

export function loadColorRecords(): ColorBaraRecord[] {
  if (!canUseStorage()) return [];
  return parseRecords(window.localStorage.getItem(LS_COLOR_RECORDS));
}

export function getSelectedColorRecord(): ColorBaraRecord | null {
  if (!canUseStorage()) return null;
  const records = loadColorRecords();
  const selectedId = window.localStorage.getItem(LS_SELECTED_COLOR_RECORD);
  return records.find((record) => record.id === selectedId) ?? records[0] ?? null;
}

export function saveColorRecord(input: SaveColorRecordInput): ColorBaraRecord {
  const now = Date.now();
  const records = loadColorRecords();
  const signature = colorRecordSignature(input);
  const existing = records.find((record) => colorRecordSignature(record) === signature);
  const record: ColorBaraRecord = {
    id: existing?.id ?? makeColorRecordId(input, now),
    name: (input.name || input.report.name || "이름 없는 사람").trim(),
    calendar: input.calendar,
    solarDate: input.solarDate,
    lunarMonth: input.lunarMonth,
    lunarDay: input.lunarDay,
    sourceLabel: input.sourceLabel,
    lunarLabel: input.lunarLabel,
    report: input.report,
    createdAt: existing?.createdAt ?? now,
    updatedAt: now,
  };

  const next = [record, ...records.filter((item) => item.id !== record.id)].slice(0, MAX_RECORDS);
  writeColorRecords(next);
  if (canUseStorage()) {
    window.localStorage.setItem(LS_SELECTED_COLOR_RECORD, record.id);
  }
  return record;
}

export function removeColorRecord(id: string): void {
  const next = loadColorRecords().filter((record) => record.id !== id);
  writeColorRecords(next);
  if (canUseStorage() && window.localStorage.getItem(LS_SELECTED_COLOR_RECORD) === id) {
    const replacement = next[0]?.id;
    if (replacement) window.localStorage.setItem(LS_SELECTED_COLOR_RECORD, replacement);
    else window.localStorage.removeItem(LS_SELECTED_COLOR_RECORD);
  }
}

export function buildColorResultHref(record: ColorBaraRecord): string {
  const params = new URLSearchParams({
    name: record.name,
    calendar: record.calendar,
  });
  if (record.calendar === "solar" && record.solarDate) {
    params.set("solarDate", record.solarDate);
  } else {
    params.set("month", String(record.lunarMonth));
    params.set("day", String(record.lunarDay));
  }
  return `/color/result?${params.toString()}`;
}

function colorRecordSignature(input: {
  name?: string;
  calendar: ColorCalendar;
  solarDate?: string;
  lunarMonth: number;
  lunarDay: number;
}): string {
  const name = (input.name || "이름 없는 사람").trim();
  const dateKey =
    input.calendar === "solar" && input.solarDate
      ? input.solarDate
      : `${input.lunarMonth}-${input.lunarDay}`;
  return `${name}|${input.calendar}|${dateKey}`;
}

function makeColorRecordId(input: SaveColorRecordInput, now: number): string {
  const source = `${colorRecordSignature(input)}|${now}`;
  let hash = 0;
  for (let i = 0; i < source.length; i += 1) {
    hash = (hash * 31 + source.charCodeAt(i)) >>> 0;
  }
  return `color-${hash.toString(16)}`;
}

function writeColorRecords(records: ColorBaraRecord[]): void {
  if (!canUseStorage()) return;
  window.localStorage.setItem(LS_COLOR_RECORDS, JSON.stringify(records));
}

function parseRecords(raw: string | null): ColorBaraRecord[] {
  if (!raw) return [];
  try {
    const parsed = JSON.parse(raw) as unknown;
    if (!Array.isArray(parsed)) return [];
    return parsed.filter(isColorRecord).sort((a, b) => b.updatedAt - a.updatedAt);
  } catch {
    return [];
  }
}

function isColorRecord(value: unknown): value is ColorBaraRecord {
  if (!value || typeof value !== "object") return false;
  const item = value as Partial<ColorBaraRecord>;
  return (
    typeof item.id === "string" &&
    typeof item.name === "string" &&
    (item.calendar === "lunar" || item.calendar === "solar") &&
    typeof item.lunarMonth === "number" &&
    typeof item.lunarDay === "number" &&
    typeof item.sourceLabel === "string" &&
    typeof item.lunarLabel === "string" &&
    typeof item.createdAt === "number" &&
    typeof item.updatedAt === "number" &&
    Boolean(item.report)
  );
}

function canUseStorage(): boolean {
  return typeof window !== "undefined" && Boolean(window.localStorage);
}
