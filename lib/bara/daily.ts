import { BARA_CARDS } from "./cards";
import type { BaraCard } from "./types";

// 22장 메이저 아르카나 (이름·짧은 의미만 미리. 본문은 결과 페이지에서 LLM/사용자가 채움)
export interface TarotCard {
  id: number;
  name: string;
  nameKr: string;
  meaning: string;
}

export const TAROT_MAJOR_ARCANA: TarotCard[] = [
  { id: 0, name: "The Fool", nameKr: "바보", meaning: "새로운 시작, 순수한 호기심" },
  { id: 1, name: "The Magician", nameKr: "마법사", meaning: "실행력, 창의성, 의지" },
  { id: 2, name: "The High Priestess", nameKr: "여사제", meaning: "직관, 비밀, 내면의 목소리" },
  { id: 3, name: "The Empress", nameKr: "여황제", meaning: "풍요, 모성, 자연" },
  { id: 4, name: "The Emperor", nameKr: "황제", meaning: "안정, 권위, 구조" },
  { id: 5, name: "The Hierophant", nameKr: "교황", meaning: "전통, 신념, 가르침" },
  { id: 6, name: "The Lovers", nameKr: "연인", meaning: "조화, 선택, 사랑" },
  { id: 7, name: "The Chariot", nameKr: "전차", meaning: "추진력, 의지, 승리" },
  { id: 8, name: "Strength", nameKr: "힘", meaning: "용기, 인내, 부드러운 강함" },
  { id: 9, name: "The Hermit", nameKr: "은둔자", meaning: "성찰, 고독, 지혜" },
  { id: 10, name: "Wheel of Fortune", nameKr: "운명의 수레바퀴", meaning: "전환점, 기회, 순환" },
  { id: 11, name: "Justice", nameKr: "정의", meaning: "공정, 책임, 진실" },
  { id: 12, name: "The Hanged Man", nameKr: "매달린 사람", meaning: "관점 전환, 기다림" },
  { id: 13, name: "Death", nameKr: "죽음", meaning: "끝과 새 시작, 변화" },
  { id: 14, name: "Temperance", nameKr: "절제", meaning: "균형, 조화, 인내" },
  { id: 15, name: "The Devil", nameKr: "악마", meaning: "집착, 유혹, 그림자" },
  { id: 16, name: "The Tower", nameKr: "탑", meaning: "급격한 변화, 해체" },
  { id: 17, name: "The Star", nameKr: "별", meaning: "희망, 영감, 평화" },
  { id: 18, name: "The Moon", nameKr: "달", meaning: "환상, 무의식, 불확실" },
  { id: 19, name: "The Sun", nameKr: "태양", meaning: "기쁨, 활력, 성공" },
  { id: 20, name: "Judgement", nameKr: "심판", meaning: "각성, 부활, 부름" },
  { id: 21, name: "The World", nameKr: "세계", meaning: "완성, 통합, 성취" },
];

function dateSeed(date = new Date()): number {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const d = String(date.getDate()).padStart(2, "0");
  return parseInt(`${y}${m}${d}`, 10);
}

function hash32(n: number): number {
  let x = n | 0;
  x = ((x ^ 0x61c88647) + (x << 13)) | 0;
  x = (x ^ (x >>> 7)) | 0;
  x = ((x + (x << 3)) ^ 0x9e3779b1) | 0;
  x = (x ^ (x >>> 17)) | 0;
  return Math.abs(x);
}

export function dailyBaraCard(date = new Date()): BaraCard {
  const idx = hash32(dateSeed(date)) % BARA_CARDS.length;
  return BARA_CARDS[idx];
}

export function dailyTarotCard(date = new Date()): TarotCard {
  const idx = hash32(dateSeed(date) + 7919) % TAROT_MAJOR_ARCANA.length;
  return TAROT_MAJOR_ARCANA[idx];
}
