import "server-only";
import type { SajuChart } from "./chart";

// ============================================================
// key_signals — 명식에서 결정론적으로 뽑는 고유 단서들
//   - 십성 카운트 / 분포
//   - 강한·약한 오행
//   - 지지 합·충·형
//   - 신살 (화개·도화·역마)
// 출력은 한국어 짧은 명사형 문자열 배열. 워싱 규칙 R3 충족 목적.
// ============================================================

const STEM_YANG = new Set(["甲", "丙", "戊", "庚", "壬"]);
const STEM_ELEMENT: Record<string, "wood" | "fire" | "earth" | "metal" | "water"> = {
  甲: "wood", 乙: "wood",
  丙: "fire", 丁: "fire",
  戊: "earth", 己: "earth",
  庚: "metal", 辛: "metal",
  壬: "water", 癸: "water",
};
const BRANCH_ELEMENT: Record<string, "wood" | "fire" | "earth" | "metal" | "water"> = {
  子: "water", 丑: "earth", 寅: "wood", 卯: "wood", 辰: "earth", 巳: "fire",
  午: "fire", 未: "earth", 申: "metal", 酉: "metal", 戌: "earth", 亥: "water",
};

const ELEMENT_GENERATES: Record<string, string> = {
  wood: "fire", fire: "earth", earth: "metal", metal: "water", water: "wood",
};
const ELEMENT_CONTROLS: Record<string, string> = {
  wood: "earth", earth: "water", water: "fire", fire: "metal", metal: "wood",
};

type TenGod =
  | "비견" | "겁재" | "식신" | "상관" | "편재" | "정재"
  | "편관" | "정관" | "편인" | "정인";

function tenGodOf(dayStem: string, otherStem: string): TenGod {
  const dme = STEM_ELEMENT[dayStem];
  const oe = STEM_ELEMENT[otherStem];
  const samePolarity = STEM_YANG.has(dayStem) === STEM_YANG.has(otherStem);
  if (dme === oe) return samePolarity ? "비견" : "겁재";
  if (ELEMENT_GENERATES[dme] === oe) return samePolarity ? "식신" : "상관";
  if (ELEMENT_GENERATES[oe] === dme) return samePolarity ? "편인" : "정인";
  if (ELEMENT_CONTROLS[dme] === oe) return samePolarity ? "편재" : "정재";
  if (ELEMENT_CONTROLS[oe] === dme) return samePolarity ? "편관" : "정관";
  return "비견";
}

// 지지를 일간 입장에서 십성으로 — 지장간 본기(주기) 대표 천간 사용
const BRANCH_MAIN_STEM: Record<string, string> = {
  子: "癸", 丑: "己", 寅: "甲", 卯: "乙", 辰: "戊", 巳: "丙",
  午: "丁", 未: "己", 申: "庚", 酉: "辛", 戌: "戊", 亥: "壬",
};

const ELEMENT_KR: Record<string, string> = {
  wood: "목", fire: "화", earth: "토", metal: "금", water: "수",
};

// 일지 그룹 → 화개/도화/역마 매핑
const SAMHAP_TRIO: Record<string, { yongsin: string; dohwa: string; yeokma: string; hwagae: string }> = {
  // 寅午戌 (火局) — 도화=卯, 역마=申, 화개=戌
  寅: { yongsin: "火", dohwa: "卯", yeokma: "申", hwagae: "戌" },
  午: { yongsin: "火", dohwa: "卯", yeokma: "申", hwagae: "戌" },
  戌: { yongsin: "火", dohwa: "卯", yeokma: "申", hwagae: "戌" },
  // 申子辰 (水局)
  申: { yongsin: "水", dohwa: "酉", yeokma: "寅", hwagae: "辰" },
  子: { yongsin: "水", dohwa: "酉", yeokma: "寅", hwagae: "辰" },
  辰: { yongsin: "水", dohwa: "酉", yeokma: "寅", hwagae: "辰" },
  // 巳酉丑 (金局)
  巳: { yongsin: "金", dohwa: "午", yeokma: "亥", hwagae: "丑" },
  酉: { yongsin: "金", dohwa: "午", yeokma: "亥", hwagae: "丑" },
  丑: { yongsin: "金", dohwa: "午", yeokma: "亥", hwagae: "丑" },
  // 亥卯未 (木局)
  亥: { yongsin: "木", dohwa: "子", yeokma: "巳", hwagae: "未" },
  卯: { yongsin: "木", dohwa: "子", yeokma: "巳", hwagae: "未" },
  未: { yongsin: "木", dohwa: "子", yeokma: "巳", hwagae: "未" },
};

const CHUNG_PAIRS: ReadonlyArray<[string, string, string]> = [
  ["子", "午", "자오충"],
  ["丑", "未", "축미충"],
  ["寅", "申", "인신충"],
  ["卯", "酉", "묘유충"],
  ["辰", "戌", "진술충"],
  ["巳", "亥", "사해충"],
];

const HAP_PAIRS: ReadonlyArray<[string, string, string]> = [
  ["子", "丑", "자축합"],
  ["寅", "亥", "인해합"],
  ["卯", "戌", "묘술합"],
  ["辰", "酉", "진유합"],
  ["巳", "申", "사신합"],
  ["午", "未", "오미합"],
];

const BRANCH_KR: Record<string, string> = {
  子: "자", 丑: "축", 寅: "인", 卯: "묘", 辰: "진", 巳: "사",
  午: "오", 未: "미", 申: "신", 酉: "유", 戌: "술", 亥: "해",
};

const BRANCH_SAFE_KR: Record<string, string> = {
  子: "자수", 丑: "축토", 寅: "인목", 卯: "묘목", 辰: "진토", 巳: "사화",
  午: "오화", 未: "미토", 申: "신금", 酉: "유금", 戌: "술토", 亥: "해수",
};

export function computeKeySignals(chart: SajuChart): string[] {
  const dayStem = chart.dayMaster.hanja;
  const out: string[] = [];

  // 1) Ten-god counts across 4 stems + 4 branches
  const stems = chart.pillars.map((p) => p.stem.hanja);
  const branches = chart.pillars.map((p) => p.branch.hanja);

  const tenGodCount: Record<string, number> = {};
  for (const s of stems) {
    if (s === dayStem) continue; // 일간 자신 제외
    tenGodCount[tenGodOf(dayStem, s)] = (tenGodCount[tenGodOf(dayStem, s)] ?? 0) + 1;
  }
  for (const b of branches) {
    const main = BRANCH_MAIN_STEM[b];
    if (!main) continue;
    tenGodCount[tenGodOf(dayStem, main)] = (tenGodCount[tenGodOf(dayStem, main)] ?? 0) + 1;
  }

  // 일간 자신은 비견 1로 셈
  tenGodCount["비견"] = (tenGodCount["비견"] ?? 0) + 1;

  // 카운트 ≥3 → "X N개", ≥2 → 그룹 강조
  const tenGodKeys: TenGod[] = ["비견","겁재","식신","상관","편재","정재","편관","정관","편인","정인"];
  for (const k of tenGodKeys) {
    const c = tenGodCount[k] ?? 0;
    if (c >= 3) out.push(`${k} ${c}개`);
  }

  // 재성·관성·인성 부재
  const jaeStr = (tenGodCount["편재"] ?? 0) + (tenGodCount["정재"] ?? 0);
  const gwanStr = (tenGodCount["편관"] ?? 0) + (tenGodCount["정관"] ?? 0);
  const inStr = (tenGodCount["편인"] ?? 0) + (tenGodCount["정인"] ?? 0);
  const sikStr = (tenGodCount["식신"] ?? 0) + (tenGodCount["상관"] ?? 0);
  if (jaeStr === 0) out.push("재성 부재");
  if (gwanStr === 0) out.push("관성 부재");
  if (inStr === 0) out.push("인성 부재");
  if (sikStr === 0) out.push("식상 부재");
  if (jaeStr >= 3) out.push(`재성 ${jaeStr}개`);
  if (gwanStr >= 3) out.push(`관성 ${gwanStr}개`);
  if (inStr >= 3) out.push(`인성 ${inStr}개`);
  if (sikStr >= 3) out.push(`식상 ${sikStr}개`);

  // 2) Element distribution
  const elementCount: Record<string, number> = { wood: 0, fire: 0, earth: 0, metal: 0, water: 0 };
  for (const s of stems) elementCount[STEM_ELEMENT[s]] = (elementCount[STEM_ELEMENT[s]] ?? 0) + 1;
  for (const b of branches) elementCount[BRANCH_ELEMENT[b]] = (elementCount[BRANCH_ELEMENT[b]] ?? 0) + 1;
  for (const [e, c] of Object.entries(elementCount)) {
    if (c >= 4) out.push(`${ELEMENT_KR[e]} 강함(${c})`);
    else if (c === 0) out.push(`${ELEMENT_KR[e]} 부재`);
  }

  // 3) 충 (clash) in branches
  const branchSet = new Set(branches);
  for (const [a, b, label] of CHUNG_PAIRS) {
    if (branchSet.has(a) && branchSet.has(b)) out.push(label);
  }
  // 4) 합 (combination)
  for (const [a, b, label] of HAP_PAIRS) {
    if (branchSet.has(a) && branchSet.has(b)) out.push(label);
  }

  // 5) 신살 — 일지 기준 도화/역마/화개
  const dayBranch = chart.pillars.find((p) => p.isDayMaster)?.branch.hanja;
  if (dayBranch && SAMHAP_TRIO[dayBranch]) {
    const { dohwa, yeokma, hwagae } = SAMHAP_TRIO[dayBranch];
    if (branchSet.has(dohwa)) out.push(`도화살(${BRANCH_KR[dohwa]})`);
    if (branchSet.has(yeokma)) out.push(`역마살(${BRANCH_KR[yeokma]})`);
    // 화개살: 일지 본인이 화개거나 다른 자리에 화개가 들어옴
    const hwagaeCount = branches.filter((b) => b === hwagae).length;
    if (hwagaeCount >= 1) {
      out.push(hwagaeCount >= 2 ? `화개살 중첩(${BRANCH_KR[hwagae]} ${hwagaeCount}개)` : `화개살(${BRANCH_KR[hwagae]})`);
    }
  }

  // 6) 자형 (self-host) — 같은 지지 2개+
  const branchCount: Record<string, number> = {};
  for (const b of branches) branchCount[b] = (branchCount[b] ?? 0) + 1;
  for (const [b, c] of Object.entries(branchCount)) {
    if (c >= 2) out.push(`${BRANCH_SAFE_KR[b] ?? BRANCH_KR[b] ?? b} ${c}개`);
  }

  // 7) 일간 자체
  out.push(`일간 ${chart.dayMaster.korean}(${ELEMENT_KR[chart.dayMaster.element]})`);

  // Dedup & cap
  return Array.from(new Set(out)).slice(0, 16);
}
