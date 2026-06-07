import "server-only";
import { DateTime } from "luxon";
import { getDayPillar, getLunarDate } from "@gracefullight/saju";

const STEM_KR: Record<string, string> = {
  甲: "갑", 乙: "을", 丙: "병", 丁: "정", 戊: "무",
  己: "기", 庚: "경", 辛: "신", 壬: "임", 癸: "계",
};

const BRANCH_KR: Record<string, string> = {
  子: "자", 丑: "축", 寅: "인", 卯: "묘", 辰: "진", 巳: "사",
  午: "오", 未: "미", 申: "신", 酉: "유", 戌: "술", 亥: "해",
};

const STEM_EN: Record<string, string> = {
  甲: "Wood", 乙: "Wood", 丙: "Fire", 丁: "Fire", 戊: "Earth",
  己: "Earth", 庚: "Metal", 辛: "Metal", 壬: "Water", 癸: "Water",
};

const BRANCH_EN: Record<string, string> = {
  子: "Rat", 丑: "Ox", 寅: "Tiger", 卯: "Rabbit", 辰: "Dragon", 巳: "Snake",
  午: "Horse", 未: "Goat", 申: "Monkey", 酉: "Rooster", 戌: "Dog", 亥: "Pig",
};

type TodayLabelLocale = "ko" | "en";

// "음 11월 12일 · 임자일" 형식. 한국(서울) 표준시 기준.
export function todayLunarLabel(
  locale: TodayLabelLocale = "ko",
  now: DateTime = DateTime.now().setZone("Asia/Seoul"),
): string {
  const lunar = getLunarDate(now.year, now.month, now.day);
  const dayPillar = getDayPillar(now.year, now.month, now.day);

  if (locale === "en") {
    const leapPrefix = lunar.isLeapMonth ? "Leap " : "";
    const stem = STEM_EN[dayPillar[0]] ?? dayPillar[0];
    const branch = BRANCH_EN[dayPillar[1]] ?? dayPillar[1];
    return `Lunar ${leapPrefix}${lunar.lunarMonth}/${lunar.lunarDay} · ${stem} ${branch} day`;
  }

  const leapPrefix = lunar.isLeapMonth ? "윤" : "";
  const stem = STEM_KR[dayPillar[0]] ?? dayPillar[0];
  const branch = BRANCH_KR[dayPillar[1]] ?? dayPillar[1];
  return `음 ${leapPrefix}${lunar.lunarMonth}월 ${lunar.lunarDay}일 · ${stem}${branch}일`;
}
