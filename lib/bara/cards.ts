import {
  BRANCHES,
  ELEMENTS,
  type BaraCard,
  type Branch,
  type Element,
} from "./types";
import { BARA_FILLED, BARA_GANZI_BY_ID } from "./cards.generated";

// 60장 카드 (5원소 × 12지지)
//
// 이미지 + 닉네임 + ganzi(motif) 는 scripts/build-bara-cards.mjs 가 자동 생성한 cards.generated.ts 에서 가져옵니다.
// 새 이미지를 추가하거나 닉네임을 변경하면 파일명 양식 유지 후 스크립트 재실행.
//
// 본문(body) 등 추가 필드는 OVERRIDES 에 키별로 직접 작성. 자동 생성된 값 위에 덮어씁니다.

type FillData = Partial<Pick<BaraCard, "nickname" | "body" | "motif" | "colorTone" | "image">>;

const OVERRIDES: Record<string, FillData> = {
  // body / colorTone 등 사람 손으로 채울 항목은 여기에.
};

function merge(id: string): FillData {
  return { ...(BARA_FILLED[id] ?? {}), ...(OVERRIDES[id] ?? {}) };
}

// re-export for backwards compatibility — `lib/bara/people.ts` 등은 BARA_GANZI_BY_ID 를 직접 안 봅니다.
export { BARA_GANZI_BY_ID };

export const BARA_CARDS: BaraCard[] = ELEMENTS.flatMap((element) =>
  BRANCHES.map((branch) => {
    const id = `${element}-${branch}`;
    const fill = merge(id);
    return {
      id,
      element,
      branch,
      nickname: fill.nickname ?? "",
      body: fill.body ?? "",
      motif: fill.motif ?? "",
      colorTone: fill.colorTone ?? "",
      image: fill.image,
    };
  }),
);

export function findCard(element: Element, branch: Branch): BaraCard | undefined {
  return BARA_CARDS.find((c) => c.element === element && c.branch === branch);
}

export function cardById(id: string): BaraCard | undefined {
  return BARA_CARDS.find((c) => c.id === id);
}

export function isCardWritten(card: BaraCard | undefined): boolean {
  return !!card && card.nickname.length > 0;
}
