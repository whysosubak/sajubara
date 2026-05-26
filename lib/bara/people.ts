// Multi-person localStorage layer.
// 사용자가 본인 외에 가족·지인의 사주도 등록할 수 있도록 지원.
// - 1번째 (본인): 무료
// - 2번째 이상: 990원 결제 게이트 (UI만, 실결제 미연동)

import type { SajuInput } from "@/lib/saju/types";

export type Relation = "본인" | "배우자" | "연인" | "가족" | "친구" | "지인" | "기타";
export type SecondaryRelation = Exclude<Relation, "본인">;

export const RELATION_OPTIONS: Relation[] = [
  "본인",
  "배우자",
  "연인",
  "가족",
  "친구",
  "지인",
  "기타",
];

export const SECONDARY_RELATION_OPTIONS: SecondaryRelation[] = [
  "배우자",
  "연인",
  "가족",
  "친구",
  "지인",
  "기타",
];

export type Person = {
  id: string;
  input: SajuInput;
  cardId: string;
  relation: Relation;
  createdAt: number;
};

export const LS_PEOPLE = "sajubara:people";
export const LS_SELECTED = "sajubara:selectedId";
export const LS_PRIMARY_CHANGED_AT = "sajubara:primaryChangedAt";
export const PRIMARY_CHANGE_INTERVAL_MS = 30 * 24 * 60 * 60 * 1000;

// Legacy keys (호환 유지)
export const LS_LEGACY_CARD = "sajubara:lastSajuCardId";
export const LS_LEGACY_INPUT = "sajubara:lastSajuInput";

function safeJSON<T>(raw: string | null, fallback: T): T {
  if (!raw) return fallback;
  try {
    return JSON.parse(raw) as T;
  } catch {
    return fallback;
  }
}

export function loadPeople(): Person[] {
  if (typeof window === "undefined") return [];
  const stored = safeJSON<Person[]>(localStorage.getItem(LS_PEOPLE), []);
  if (stored.length > 0) return stored;

  // Migration: legacy single-person → people[0]
  const legacyInput = safeJSON<SajuInput | null>(localStorage.getItem(LS_LEGACY_INPUT), null);
  const legacyCardId = localStorage.getItem(LS_LEGACY_CARD);
  if (legacyInput && legacyCardId) {
    const me: Person = {
      id: makeId(),
      input: legacyInput,
      cardId: legacyCardId,
      relation: "본인",
      createdAt: Date.now(),
    };
    savePeople([me]);
    setSelectedId(me.id);
    return [me];
  }
  return [];
}

export function savePeople(list: Person[]): void {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(LS_PEOPLE, JSON.stringify(list));
  } catch {
    // best-effort
  }
}

export function getSelectedId(): string | null {
  if (typeof window === "undefined") return null;
  return localStorage.getItem(LS_SELECTED);
}

export function setSelectedId(id: string | null): void {
  if (typeof window === "undefined") return;
  try {
    if (id) localStorage.setItem(LS_SELECTED, id);
    else localStorage.removeItem(LS_SELECTED);
  } catch {
    // best-effort
  }
}

export function getSelectedPerson(): Person | null {
  const all = loadPeople();
  if (all.length === 0) return null;
  const sel = getSelectedId();
  if (sel) {
    const found = all.find((p) => p.id === sel);
    if (found) return found;
  }
  return all[0]; // fallback to first
}

export function getPrimaryPerson(list: Person[] = loadPeople()): Person | null {
  return list.find((person) => person.relation === "본인") ?? null;
}

export function addOrUpdatePerson(args: {
  input: SajuInput;
  cardId: string;
  relation?: Relation;
}): Person {
  const list = loadPeople();
  // Match by input (name+birthDate+birthTime+gender+calendar): treat as same person → update
  const matchIdx = list.findIndex(
    (p) =>
      p.input.name === args.input.name &&
      p.input.birthDate === args.input.birthDate &&
      p.input.birthTime === args.input.birthTime &&
      p.input.gender === args.input.gender &&
      p.input.calendar === args.input.calendar,
  );
  if (matchIdx >= 0) {
    list[matchIdx] = { ...list[matchIdx], cardId: args.cardId };
    savePeople(list);
    setSelectedId(list[matchIdx].id);
    syncLegacy(list[matchIdx]);
    return list[matchIdx];
  }
  const created: Person = {
    id: makeId(),
    input: args.input,
    cardId: args.cardId,
    relation: args.relation ?? (list.length === 0 ? "본인" : "기타"),
    createdAt: Date.now(),
  };
  const next = [...list, created];
  savePeople(next);
  setSelectedId(created.id);
  syncLegacy(created);
  return created;
}

export function removePerson(id: string): void {
  const list = loadPeople();
  const next = list.filter((p) => p.id !== id);
  savePeople(next);
  const sel = getSelectedId();
  if (sel === id) {
    const fallback = next[0]?.id ?? null;
    setSelectedId(fallback);
    if (fallback) {
      const target = next.find((p) => p.id === fallback);
      if (target) syncLegacy(target);
    } else {
      clearLegacy();
    }
  }
}

export function updateRelation(id: string, relation: Relation): void {
  const list = loadPeople();
  const idx = list.findIndex((p) => p.id === id);
  if (idx < 0) return;
  list[idx] = { ...list[idx], relation };
  savePeople(list);
}

export function setPrimaryPerson(
  id: string,
  demoteRelation: SecondaryRelation = "기타",
): Person | null {
  const list = loadPeople();
  const target = list.find((person) => person.id === id);
  if (!target) return null;

  const next = list.map((person) => {
    if (person.id === id) return { ...person, relation: "본인" as const };
    if (person.relation === "본인") return { ...person, relation: demoteRelation };
    return person;
  });
  savePeople(next);
  setSelectedId(id);
  const nextTarget = next.find((person) => person.id === id) ?? null;
  if (nextTarget) syncLegacy(nextTarget);
  return nextTarget;
}

export function recordPrimaryChange(at = Date.now()): void {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(LS_PRIMARY_CHANGED_AT, String(at));
  } catch {
    // best-effort
  }
}

export function getPrimaryChangeStatus(now = Date.now()): {
  canChange: boolean;
  changedAt: number | null;
  nextAllowedAt: number | null;
} {
  if (typeof window === "undefined") {
    return { canChange: true, changedAt: null, nextAllowedAt: null };
  }
  const changedAt = Number(localStorage.getItem(LS_PRIMARY_CHANGED_AT));
  if (!Number.isFinite(changedAt) || changedAt <= 0) {
    return { canChange: true, changedAt: null, nextAllowedAt: null };
  }
  const nextAllowedAt = changedAt + PRIMARY_CHANGE_INTERVAL_MS;
  return {
    canChange: now >= nextAllowedAt,
    changedAt,
    nextAllowedAt,
  };
}

export function isLocked(person: Person | null, list: Person[] | null = null): boolean {
  if (!person) return false;
  const all = list ?? loadPeople();
  const idx = all.findIndex((p) => p.id === person.id);
  return idx > 0; // 1번째(idx=0)만 무료
}

// Keep legacy localStorage keys in sync so existing pages still work without refactor.
function syncLegacy(p: Person): void {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(LS_LEGACY_CARD, p.cardId);
    localStorage.setItem(LS_LEGACY_INPUT, JSON.stringify(p.input));
  } catch {
    // best-effort
  }
}

function clearLegacy(): void {
  if (typeof window === "undefined") return;
  try {
    localStorage.removeItem(LS_LEGACY_CARD);
    localStorage.removeItem(LS_LEGACY_INPUT);
  } catch {
    // best-effort
  }
}

function makeId(): string {
  return `p_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 7)}`;
}
