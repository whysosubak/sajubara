"use client";

import { useEffect } from "react";
import { addOrUpdatePerson, LS_LEGACY_CARD, LS_LEGACY_INPUT } from "@/lib/bara/people";
import type { Relation } from "@/lib/bara/people";
import type { SajuInput } from "@/lib/saju/types";

// 호환용 alias — 다른 파일이 import해서 쓸 수 있도록 유지
export const LS_CARD_ID = LS_LEGACY_CARD;
export const LS_SAJU_INPUT = LS_LEGACY_INPUT;

export default function SaveLastSajuCard({
  cardId,
  input,
  relation,
}: {
  cardId: string;
  input: SajuInput;
  relation?: Relation;
}) {
  useEffect(() => {
    addOrUpdatePerson({ cardId, input, relation });
  }, [cardId, input, relation]);
  return null;
}
