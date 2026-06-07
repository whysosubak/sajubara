export type Element = "wood" | "fire" | "earth" | "metal" | "water";

export type Branch =
  | "rat" | "ox" | "tiger" | "rabbit"
  | "dragon" | "snake" | "horse" | "goat"
  | "monkey" | "rooster" | "dog" | "pig";

export interface BaraCard {
  id: string;
  element: Element;
  branch: Branch;
  nickname: string;
  body: string;
  motif: string;
  colorTone: string;
  image?: string;
}

export const ELEMENTS: Element[] = ["wood", "fire", "earth", "metal", "water"];

export const BRANCHES: Branch[] = [
  "rat", "ox", "tiger", "rabbit", "dragon", "snake",
  "horse", "goat", "monkey", "rooster", "dog", "pig",
];

export const ELEMENT_LABEL_KR: Record<Element, string> = {
  wood: "목", fire: "화", earth: "토", metal: "금", water: "수",
};

export const ELEMENT_LABEL_EN: Record<Element, string> = {
  wood: "Wood", fire: "Fire", earth: "Earth", metal: "Metal", water: "Water",
};

export const ELEMENT_NAME_KR: Record<Element, string> = {
  wood: "나무", fire: "불", earth: "흙", metal: "쇠", water: "물",
};

// 오행 전통 색 — wood=청(푸른), fire=적(붉은), earth=황(황금), metal=백(하얀), water=흑(검은)
export const ELEMENT_COLOR_KR: Record<Element, string> = {
  wood: "푸른", fire: "붉은", earth: "황금", metal: "하얀", water: "검은",
};

export const ELEMENT_COLOR_EN: Record<Element, string> = {
  wood: "Green", fire: "Red", earth: "Yellow", metal: "White", water: "Black",
};

export const ELEMENT_EMOJI: Record<Element, string> = {
  wood: "🌿", fire: "🔥", earth: "🪨", metal: "⚙️", water: "💧",
};

export const BRANCH_LABEL_KR: Record<Branch, string> = {
  rat: "쥐", ox: "소", tiger: "호랑이", rabbit: "토끼",
  dragon: "용", snake: "뱀", horse: "말", goat: "양",
  monkey: "원숭이", rooster: "닭", dog: "개", pig: "돼지",
};

export const BRANCH_LABEL_EN: Record<Branch, string> = {
  rat: "Rat", ox: "Ox", tiger: "Tiger", rabbit: "Rabbit",
  dragon: "Dragon", snake: "Snake", horse: "Horse", goat: "Goat",
  monkey: "Monkey", rooster: "Rooster", dog: "Dog", pig: "Pig",
};

export const BRANCH_EMOJI: Record<Branch, string> = {
  rat: "🐭", ox: "🐮", tiger: "🐯", rabbit: "🐰",
  dragon: "🐲", snake: "🐍", horse: "🐴", goat: "🐑",
  monkey: "🐵", rooster: "🐔", dog: "🐶", pig: "🐷",
};

export const STEM_HANJA_TO_ELEMENT: Record<string, Element> = {
  甲: "wood", 乙: "wood",
  丙: "fire", 丁: "fire",
  戊: "earth", 己: "earth",
  庚: "metal", 辛: "metal",
  壬: "water", 癸: "water",
};

export const BRANCH_HANJA_TO_KEY: Record<string, Branch> = {
  子: "rat", 丑: "ox", 寅: "tiger", 卯: "rabbit",
  辰: "dragon", 巳: "snake", 午: "horse", 未: "goat",
  申: "monkey", 酉: "rooster", 戌: "dog", 亥: "pig",
};
