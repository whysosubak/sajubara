import "server-only";
import { DateTime } from "luxon";
import { createLuxonAdapter } from "@gracefullight/saju/adapters/luxon";
import { getCurrentMajorLuck, getSaju } from "@gracefullight/saju";
import type { DateAdapter } from "@gracefullight/saju";
import { currentKstYear } from "./report-links";
import type { SajuInput } from "./types";

const STEM_KR: Record<string, string> = {
  甲: "갑", 乙: "을", 丙: "병", 丁: "정", 戊: "무",
  己: "기", 庚: "경", 辛: "신", 壬: "임", 癸: "계",
};

const BRANCH_KR: Record<string, string> = {
  子: "자", 丑: "축", 寅: "인", 卯: "묘", 辰: "진", 巳: "사",
  午: "오", 未: "미", 申: "신", 酉: "유", 戌: "술", 亥: "해",
};

const STEM_ELEMENT: Record<string, "wood" | "fire" | "earth" | "metal" | "water"> = {
  甲: "wood", 乙: "wood", 丙: "fire", 丁: "fire", 戊: "earth",
  己: "earth", 庚: "metal", 辛: "metal", 壬: "water", 癸: "water",
};

const BRANCH_ELEMENT: Record<string, "wood" | "fire" | "earth" | "metal" | "water"> = {
  子: "water", 丑: "earth", 寅: "wood", 卯: "wood", 辰: "earth", 巳: "fire",
  午: "fire", 未: "earth", 申: "metal", 酉: "metal", 戌: "earth", 亥: "water",
};

const HOUR_BY_BIRTH_TIME: Record<string, [number, number]> = {
  자시: [0, 30],
  축시: [2, 30],
  인시: [4, 30],
  묘시: [6, 30],
  진시: [8, 30],
  사시: [10, 30],
  오시: [12, 30],
  미시: [14, 30],
  신시: [16, 30],
  유시: [18, 30],
  술시: [20, 30],
  해시: [22, 30],
  모름: [12, 0],
};

export type ChartElement = "wood" | "fire" | "earth" | "metal" | "water";

export type ChartPillar = {
  position: "시" | "일" | "월" | "년";
  stem: { hanja: string; korean: string; element: ChartElement };
  branch: { hanja: string; korean: string; element: ChartElement };
  stemTenGod: string;
  branchTenGod: string;
  twelveStage: string;
  sinsals: string[];
  relations: string[];
  isDayMaster: boolean;
};

export type ChartCell = {
  hanja: string;
  korean: string;
  element: ChartElement;
};

export type DaewoonItem = {
  index: number;
  startAge: number;
  endAge: number;
  stem: ChartCell;
  branch: ChartCell;
  pillar: string;
  isCurrent: boolean;
};

export type YearlyItem = {
  year: number;
  age: number;
  stem: ChartCell;
  branch: ChartCell;
  pillar: string;
  isCurrent: boolean;
};

export type SajuChart = {
  hourUnknown: boolean;
  pillars: ChartPillar[];
  dayMaster: { hanja: string; korean: string; element: ChartElement };
  lunar: { year: number; month: number; day: number };
  currentLuck: { age: number; stem: string; branch: string; pillar: string } | null;
  daewoonList: DaewoonItem[];
  yearlyList: YearlyItem[];
  age: number;
};

function mkCell(hanja: string): ChartCell {
  return {
    hanja,
    korean: STEM_KR[hanja] ?? BRANCH_KR[hanja] ?? hanja,
    element: (STEM_ELEMENT[hanja] ?? BRANCH_ELEMENT[hanja]) as ChartElement,
  };
}

const SOURCE_POSITION_BY_KR: Record<ChartPillar["position"], "hour" | "day" | "month" | "year"> = {
  시: "hour",
  일: "day",
  월: "month",
  년: "year",
};

function relationLabel(relation: unknown): string | null {
  if (!relation || typeof relation !== "object") return null;
  const r = relation as {
    type?: { korean?: string };
    pair?: string[];
    branches?: string[];
  };
  const type = r.type?.korean ?? "";
  const chars = Array.isArray(r.pair)
    ? r.pair.join("")
    : Array.isArray(r.branches)
      ? r.branches.join("")
      : "";
  const label = `${chars}${type}`.trim();
  return label || null;
}

let cachedAdapter: DateAdapter<DateTime> | null = null;
async function getAdapter() {
  if (!cachedAdapter) cachedAdapter = await createLuxonAdapter();
  return cachedAdapter;
}

export async function computeChart(input: SajuInput): Promise<SajuChart> {
  const adapter = await getAdapter();
  const [hour, minute] = HOUR_BY_BIRTH_TIME[input.birthTime] ?? [12, 0];
  const hourUnknown = input.birthTime === "모름";

  if (input.calendar === "음력") {
    throw new Error(
      "음력 변환은 아직 준비 중이에요. 양력으로 입력해 주세요.",
    );
  }

  const [y, m, d] = input.birthDate.split("-").map((n) => parseInt(n, 10));
  const dt = DateTime.fromObject(
    { year: y, month: m, day: d, hour, minute },
    { zone: "Asia/Seoul" },
  );
  if (!dt.isValid) {
    throw new Error(`잘못된 생년월일 형식이에요: ${input.birthDate}`);
  }

  const thisYear = currentKstYear();
  const result = getSaju(dt, {
    adapter,
    gender: input.gender === "남" ? "male" : "female",
    yearlyLuckRange: { from: thisYear - 3, to: thisYear + 6 },
  });

  const dmHanja = result.tenGods.dayMaster;
  const age = thisYear - y;
  const current = getCurrentMajorLuck(result.majorLuck, age);

  const positions: ChartPillar["position"][] = ["시", "일", "월", "년"];
  const sources = [
    result.tenGods.hour,
    result.tenGods.day,
    result.tenGods.month,
    result.tenGods.year,
  ];

  const pillars: ChartPillar[] = positions.map((position, i) => {
    const src = sources[i];
    const sourcePosition = SOURCE_POSITION_BY_KR[position];
    const stemHanja = src.stem.char;
    const branchHanja = src.branch.char;
    const isDayMaster = position === "일";
    const sinsals = result.sinsals.matches
      .filter((match) => match.position === sourcePosition)
      .map((match) => match.sinsal.korean);
    const relations = result.relations.all
      .filter((relation) => {
        const relationPositions = (relation as { positions?: string[] }).positions;
        return Array.isArray(relationPositions) && relationPositions.includes(sourcePosition);
      })
      .map(relationLabel)
      .filter((label): label is string => Boolean(label));
    return {
      position,
      stem: {
        hanja: stemHanja,
        korean: STEM_KR[stemHanja] ?? stemHanja,
        element: STEM_ELEMENT[stemHanja],
      },
      branch: {
        hanja: branchHanja,
        korean: BRANCH_KR[branchHanja] ?? branchHanja,
        element: BRANCH_ELEMENT[branchHanja],
      },
      stemTenGod: isDayMaster ? "일원" : src.stem.tenGod.korean,
      branchTenGod: src.branch.tenGod.korean,
      twelveStage: result.twelveStages[sourcePosition].korean,
      sinsals: Array.from(new Set(sinsals)).slice(0, 6),
      relations: Array.from(new Set(relations)).slice(0, 4),
      isDayMaster,
    };
  });

  const daewoonList: DaewoonItem[] = result.majorLuck.pillars.map((p) => ({
    index: p.index,
    startAge: p.startAge,
    endAge: p.endAge,
    stem: mkCell(p.stem),
    branch: mkCell(p.branch),
    pillar: p.pillar,
    isCurrent: age >= p.startAge && age <= p.endAge,
  }));

  const yearlyList: YearlyItem[] = result.yearlyLuck.map((y) => ({
    year: y.year,
    age: y.age,
    stem: mkCell(y.stem),
    branch: mkCell(y.branch),
    pillar: y.pillar,
    isCurrent: y.year === thisYear,
  }));

  return {
    hourUnknown,
    pillars,
    dayMaster: {
      hanja: dmHanja,
      korean: STEM_KR[dmHanja] ?? dmHanja,
      element: STEM_ELEMENT[dmHanja],
    },
    lunar: {
      year: result.lunar.lunarYear,
      month: result.lunar.lunarMonth,
      day: result.lunar.lunarDay,
    },
    currentLuck: current
      ? { age, stem: current.stem, branch: current.branch, pillar: current.pillar }
      : null,
    daewoonList,
    yearlyList,
    age,
  };
}

export function chartAsContext(chart: SajuChart): string {
  const lines: string[] = [];
  lines.push("아래는 결정론적으로 계산된 사주 데이터야. 이걸 근거로 해석해줘.");
  lines.push("");
  lines.push("[사주 4기둥] (시 / 일 / 월 / 년 순)");
  for (const p of chart.pillars) {
    const note = p.isDayMaster ? " (일간/본인)" : "";
    const hourNote = p.position === "시" && chart.hourUnknown ? " (시간 모름 — 참고만)" : "";
    lines.push(
      `- ${p.position}주: 천간 ${p.stem.hanja}(${p.stem.korean}, ${p.stemTenGod}) / 지지 ${p.branch.hanja}(${p.branch.korean}, ${p.branchTenGod})${note}${hourNote}`,
    );
  }
  lines.push("");
  lines.push(
    `[일간] ${chart.dayMaster.hanja}(${chart.dayMaster.korean}, ${chart.dayMaster.element}) — 이 사람의 본명이야.`,
  );
  if (chart.currentLuck) {
    lines.push(
      `[현재 대운] ${chart.currentLuck.pillar} (만 ${chart.currentLuck.age}세 기준)`,
    );
  }
  lines.push(`[음력 생일] ${chart.lunar.year}년 ${chart.lunar.month}월 ${chart.lunar.day}일`);
  return lines.join("\n");
}
