import "server-only";
import { createHash } from "node:crypto";

const STEM_ORDER = ["甲", "乙", "丙", "丁", "戊", "己", "庚", "辛", "壬", "癸"];
const STEM_YANG = new Set(["甲", "丙", "戊", "庚", "壬"]);
const STEM_ELEMENT: Record<string, "wood" | "fire" | "earth" | "metal" | "water"> = {
  甲: "wood", 乙: "wood",
  丙: "fire", 丁: "fire",
  戊: "earth", 己: "earth",
  庚: "metal", 辛: "metal",
  壬: "water", 癸: "water",
};

// 월건법 — 연간 천간이 정해주는 정월(寅月) 천간 시작
const YEAR_STEM_TO_MONTH1_STEM: Record<string, string> = {
  甲: "丙", 己: "丙",
  乙: "戊", 庚: "戊",
  丙: "庚", 辛: "庚",
  丁: "壬", 壬: "壬",
  戊: "甲", 癸: "甲",
};

export function monthStem(yearStem: string, monthNo: number): string {
  const start = YEAR_STEM_TO_MONTH1_STEM[yearStem];
  if (!start) return "甲";
  const idx = (STEM_ORDER.indexOf(start) + (monthNo - 1)) % 10;
  return STEM_ORDER[idx];
}

// 일간 vs 다른 천간 → 십성 (TenGod)
export type TenGod =
  | "비견" | "겁재" | "식신" | "상관" | "편재" | "정재"
  | "편관" | "정관" | "편인" | "정인";

const ELEMENT_GENERATES: Record<string, string> = {
  wood: "fire", fire: "earth", earth: "metal", metal: "water", water: "wood",
};
const ELEMENT_CONTROLS: Record<string, string> = {
  wood: "earth", earth: "water", water: "fire", fire: "metal", metal: "wood",
};

export function tenGod(dayMasterStem: string, otherStem: string): TenGod {
  const dme = STEM_ELEMENT[dayMasterStem];
  const oe = STEM_ELEMENT[otherStem];
  const dmYang = STEM_YANG.has(dayMasterStem);
  const oYang = STEM_YANG.has(otherStem);
  const samePolarity = dmYang === oYang;

  if (dme === oe) return samePolarity ? "비견" : "겁재";
  if (ELEMENT_GENERATES[dme] === oe) return samePolarity ? "식신" : "상관";
  if (ELEMENT_GENERATES[oe] === dme) return samePolarity ? "편인" : "정인";
  if (ELEMENT_CONTROLS[dme] === oe) return samePolarity ? "편재" : "정재";
  if (ELEMENT_CONTROLS[oe] === dme) return samePolarity ? "편관" : "정관";
  return "비견"; // fallback
}

// ============================================================
// 월별 부제 POOL
// ============================================================

const MONTH_POOL_BY_TENGOD: Record<TenGod, string[]> = {
  비견: [
    "자존감 뿜뿜 경쟁의 서막",
    "내 영역을 지키는 달",
    "비교는 그만, 내 갈 길로",
    "동지와 라이벌이 동시에 보이는 달",
    "단단한 자기 확신의 결",
    "혼자 빛나는 자리의 달",
  ],
  겁재: [
    "기 빼앗기는 사람 조심",
    "친구에게 새는 지갑 주의",
    "동업·공동작업 조심하는 달",
    "내 몫 챙기는 결단의 달",
    "충돌과 자극이 교차하는 달",
    "투자·돈거래 한 박자 멈춤",
  ],
  식신: [
    "창작과 표현이 빛나는 달",
    "결과물이 인정받는 달",
    "맛집·여행·취미가 살아나는 결",
    "여유와 풍요의 달",
    "내 페이스로 즐기는 달",
    "감각이 깨어나는 시기",
  ],
  상관: [
    "한마디가 운명을 가르는 달",
    "표현 폭발·구설 주의",
    "튀어야 사는 달, 톤 조심",
    "감각이 폭주하는 시기",
    "재능 발휘와 입조심 사이",
    "스포트라이트 받는 양날의 달",
  ],
  편재: [
    "큰돈이 움직이는 달",
    "기회는 많고 손도 빠른 달",
    "투자·사업 감각이 살아나는 결",
    "현금흐름이 출렁이는 달",
    "사람과 돈이 함께 움직이는 달",
    "한 방의 유혹 조심",
  ],
  정재: [
    "지갑이 두꺼워지는 달",
    "성실한 수익의 결",
    "통장 잔고가 안정되는 시기",
    "월급·정기 수입이 빛나는 달",
    "차근차근 쌓이는 달",
    "현실 감각이 살아나는 결",
  ],
  편관: [
    "긴장과 결단의 칼날을 가는 달",
    "권위와 부딪치는 달, 명분이 핵심",
    "압박이 추진력으로 바뀌는 결",
    "변수와 변동이 동시에 오는 달",
    "결단의 무게가 무거워지는 달",
    "한 방향 돌파가 통하는 시기",
  ],
  정관: [
    "승진 라인을 타는 달",
    "책임이 무거워지는 달",
    "명분과 자리가 단단해지는 결",
    "공식 자리에서 빛나는 달",
    "약속이 곧 신뢰가 되는 시기",
    "정도(正道)가 통하는 달",
  ],
  편인: [
    "직감이 날카로워지는 달",
    "혼자만의 사색이 깊어지는 결",
    "낯선 영감이 들어오는 시기",
    "이상한 만남이 통찰을 주는 달",
    "전공 밖 영역에 끌리는 달",
    "이면의 진실이 보이는 시기",
  ],
  정인: [
    "배움의 문이 열리는 달",
    "문서운이 밝아지는 달",
    "보호와 안정의 결",
    "스승·멘토와 가까워지는 시기",
    "정보가 곧 자산이 되는 달",
    "공부와 자격증의 달",
  ],
};

// 계절·달 변주용 미세 풀
const MONTH_POOL_SEASONAL: Record<number, string[]> = {
  1: ["새해 첫 다짐의 달", "올해의 골조를 세우는 달"],
  2: ["봄의 시동이 걸리는 달", "설렘과 분주함의 달"],
  3: ["벚꽃처럼 떠오르는 매력의 달", "봄볕에 새 일이 트이는 달"],
  4: ["꽃이 만개하는 절정의 달", "관계가 풍성해지는 달"],
  5: ["햇살 듬뿍 인복이 쌓이는 달", "외부 활동이 빛나는 달"],
  6: ["멘탈 관리 1순위 경보", "장마처럼 정체될 수 있는 달"],
  7: ["충돌 주의 변화의 바람", "한여름 격류의 달"],
  8: ["문서운 대박 계약의 기회", "맺어지는 결의 달"],
  9: ["일잘러 등극 성과 폭발", "수확의 결이 보이는 달"],
  10: ["입조심 몸조심 초비상", "정리·점검의 달"],
  11: ["겨울 곳간에 재물 가득", "안으로 쌓이는 달"],
  12: ["매력 발산하며 한해 마무리", "한 해를 갈무리하는 달"],
};

// ============================================================
// 6대 운세 부제 POOL
// ============================================================

export type FortuneKey = "love" | "relationship" | "money" | "work" | "health" | "growth";

const FORTUNE_POOL: Record<FortuneKey, string[]> = {
  love: [
    "도파민 터지는 반전 로맨스",
    "정리할 사람과 들어올 사람이 갈리는 해",
    "예상 밖 인연이 깊어지는 결",
    "감정의 온도차가 분기점이 되는 해",
    "이상형 안 닮은 사람에게 끌리는 결",
    "지금 옆 사람 한 번 더 보게 되는 해",
  ],
  relationship: [
    "가까운 사람과 거리 조절이 갈리는 해",
    "말 한마디가 평판을 바꾸는 해",
    "새 인맥보다 오래된 관계 점검",
    "부드러운 선 긋기가 필요한 해",
    "도와줄 사람과 지치게 할 사람이 갈리는 결",
    "혼자 버티지 말고 역할을 나눌 때",
  ],
  money: [
    "문서가 곧 현금이 되는 해",
    "들어오는 만큼 새는 결, 가계부 필수",
    "한 방 보다 차근차근 통장 두께",
    "투자·이직이 머니 라인 가르는 해",
    "지갑 단속과 뜻밖의 재물 사이",
    "겨울 곳간에 재물이 쌓이는 결",
  ],
  health: [
    "수분 충전과 멘탈 케어",
    "예민함이 무기이자 약점인 해",
    "허리·소화기 신호 잘 보살피기",
    "잠을 줄이면 1순위로 무너지는 결",
    "햇살과 산책이 보약이 되는 해",
    "취미가 곧 회복인 결",
  ],
  work: [
    "능력 인정받는 퀀텀점프",
    "윗사람 한 줄이 운명을 바꾸는 해",
    "이직·전환의 결이 트이는 해",
    "사이드 프로젝트가 본업을 흔드는 결",
    "성과보다 사람이 더 보이는 해",
    "맡은 자리가 한 단계 올라가는 결",
  ],
  growth: [
    "자격증과 배움이 무기가 되는 해",
    "문서운이 자기 갱신의 동력이 되는 해",
    "독서·강의가 자산으로 쌓이는 해",
    "낯선 분야가 진짜 답이 되는 결",
    "공부 모임이 인맥이 되는 해",
    "한 권 정독이 통장보다 큰 해",
  ],
};

// ============================================================
// Deterministic picker (seeded by birthHash + scope key)
// ============================================================

function seededIndex(pool: readonly string[], seed: string): number {
  if (pool.length === 0) return 0;
  const h = createHash("sha256").update(seed).digest();
  const n = h.readUInt32BE(0);
  return n % pool.length;
}

function seededPick(pool: readonly string[], seed: string): string {
  if (pool.length === 0) return "";
  return pool[seededIndex(pool, seed)];
}

export function pickMonthSubtitle(args: {
  yearStem: string;        // 한자 (e.g. "丙")
  dayMasterStem: string;   // 한자 (e.g. "癸")
  monthNo: number;         // 1..12
  birthHash: string;       // for deterministic seed
  year: number;
}): string {
  const mStem = monthStem(args.yearStem, args.monthNo);
  const tg = tenGod(args.dayMasterStem, mStem);
  const seed = `${args.birthHash}|${args.year}|${args.monthNo}`;

  // Mix: 75% from tenGod pool, 25% from seasonal pool
  const h = createHash("sha256").update(seed + "|mix").digest();
  const mix = h.readUInt8(0);
  const useSeasonal = mix < 64; // ~25%

  const pool = useSeasonal
    ? MONTH_POOL_SEASONAL[args.monthNo] ?? MONTH_POOL_BY_TENGOD[tg]
    : MONTH_POOL_BY_TENGOD[tg];

  return seededPick(pool, seed);
}

export function pickFortuneSubtitle(args: {
  key: FortuneKey;
  birthHash: string;
  year: number;
}): string {
  return seededPick(FORTUNE_POOL[args.key], `${args.birthHash}|${args.year}|fortune|${args.key}`);
}
