"use client";

import { useEffect } from "react";
import type { ColorNumerologyReport } from "@/lib/color/numerology";
import { saveColorRecord, type ColorCalendar } from "@/lib/color/storage";

type SaveColorBaraResultProps = {
  name?: string;
  calendar: ColorCalendar;
  solarDate?: string;
  lunarMonth: number;
  lunarDay: number;
  sourceLabel: string;
  lunarLabel: string;
  report: ColorNumerologyReport;
};

export default function SaveColorBaraResult({
  name,
  calendar,
  solarDate,
  lunarMonth,
  lunarDay,
  sourceLabel,
  lunarLabel,
  report,
}: SaveColorBaraResultProps) {
  useEffect(() => {
    saveColorRecord({
      name,
      calendar,
      solarDate,
      lunarMonth,
      lunarDay,
      sourceLabel,
      lunarLabel,
      report,
    });
  }, [calendar, lunarDay, lunarLabel, lunarMonth, name, report, solarDate, sourceLabel]);

  return null;
}
