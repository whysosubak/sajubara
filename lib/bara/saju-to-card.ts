import type { SajuChart } from "@/lib/saju/chart";
import { findCard } from "./cards";
import {
  BRANCH_HANJA_TO_KEY,
  STEM_HANJA_TO_ELEMENT,
  type BaraCard,
} from "./types";

// 사주 차트의 일주(일간 천간 + 일지)를 기준으로 60카드 중 1장에 매핑.
// 일간 천간 → 원소 (5종) × 일지 지지 → 지지 (12종) = 60.
export function cardFromChart(chart: SajuChart): BaraCard | undefined {
  const dayPillar = chart.pillars.find((p) => p.isDayMaster);
  if (!dayPillar) return undefined;

  const element = STEM_HANJA_TO_ELEMENT[chart.dayMaster.hanja];
  const branch = BRANCH_HANJA_TO_KEY[dayPillar.branch.hanja];
  if (!element || !branch) return undefined;

  return findCard(element, branch);
}
