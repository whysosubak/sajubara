import type { SajuInput } from "@/lib/saju/types";

export function sajuPersonKey(input: SajuInput): string {
  return fnv1aHex(
    [
      input.name.trim(),
      input.birthDate,
      input.birthTime,
      input.gender,
      input.calendar,
    ].join("|"),
  );
}

export function sajuPersonProduct(input: SajuInput): string {
  return `saju:${sajuPersonKey(input)}`;
}

function fnv1aHex(value: string): string {
  let hash = 0x811c9dc5;
  for (let i = 0; i < value.length; i += 1) {
    hash ^= value.charCodeAt(i);
    hash = Math.imul(hash, 0x01000193);
  }
  return (hash >>> 0).toString(16).padStart(8, "0");
}
