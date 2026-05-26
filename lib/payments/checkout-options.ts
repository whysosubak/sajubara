import {
  isScopeUnlocked,
  type MockEntitlements,
  type MockPlanId,
  type PaidContentScope,
} from "@/lib/auth/mock-entitlements";
import { currentKstYear } from "@/lib/saju/report-links";
import { appendPaidParamsToReturnTo } from "@/lib/payments/checkout";

export type CheckoutOption = {
  id: MockPlanId;
  title: string;
  subtitle: string;
  amount: number;
  baseAmount: number;
  creditAmount: number;
  badge?: string;
  features: string[];
  ownedLabels: string[];
  ownedCount: number;
  totalUnits: number;
};

type BaseCheckoutOption = Omit<
  CheckoutOption,
  "amount" | "baseAmount" | "creditAmount" | "ownedLabels" | "ownedCount" | "totalUnits"
> & {
  baseAmount: number;
};

type UnlockUnit = {
  key: string;
  label: string;
  scope?: PaidContentScope;
  scopeKey?: string;
};

export function formatWon(amount: number): string {
  return new Intl.NumberFormat("ko-KR").format(amount);
}

export function buildCheckoutOptions({
  amount,
  entitlements,
  product,
  returnTo,
  title,
}: {
  amount: number;
  entitlements: MockEntitlements;
  product: string;
  returnTo: string;
  title: string;
}): CheckoutOption[] {
  const isDaily = product.startsWith("daily:");
  const isYuzuCharge = product.startsWith("yuzu:");
  if (isYuzuCharge) {
    return [
      withOwnershipPricing(
        {
          id: "single",
          title,
          subtitle: "사주바라 유료 해설에 사용할 유자를 충전해요",
          baseAmount: amount,
          features: ["충전소 잔액 반영", "실결제 승인", "보관함과 리포트에서 사용"],
        },
        entitlements,
        product,
        returnTo,
      ),
    ];
  }

  const baseOptions: BaseCheckoutOption[] = [
    {
      id: "single",
      title: isDaily ? "이 날 운세만 보기" : "이 리포트만 열기",
      subtitle: title,
      baseAmount: amount,
      features: isDaily
        ? ["선택한 날짜 1일 해석", "목적 맞춤 운세"]
        : ["현재 보고 있는 잠금 해설", "보관함에서 다시 보기"],
    },
    {
      id: "today-pack",
      title: "오늘의 바라팩",
      subtitle: "사주바라 + 현재 대운 + 올해 운세",
      baseAmount: 2900,
      badge: "추천",
      features: ["사주바라 전체 해설", "현재 10년 대운 상세", "올해 연도별 운세 상세", "보관함 저장"],
    },
    {
      id: "life-pack",
      title: "내 인생 흐름팩",
      subtitle: "큰 흐름을 한 번에 보는 전체팩",
      baseAmount: 9900,
      features: ["사주바라 전체", "현재 대운 + 미래 3주기", "올해 + 미래 3년 운세", "PDF/공유 링크"],
    },
  ];

  if (isDaily) {
    return baseOptions
      .slice(0, 1)
      .map((option) => withOwnershipPricing(option, entitlements, product, returnTo));
  }

  return baseOptions
    .map((option) => withOwnershipPricing(option, entitlements, product, returnTo))
    .filter(shouldShowCheckoutOption);
}

export function appendCheckoutOptionToReturnTo(
  returnTo: string,
  option: CheckoutOption,
): string {
  return appendPaidParamsToReturnTo({
    amount: option.amount,
    plan: option.id,
    returnTo,
  });
}

function withOwnershipPricing(
  option: BaseCheckoutOption,
  entitlements: MockEntitlements,
  product: string,
  returnTo: string,
): CheckoutOption {
  const units = uniqueUnlockUnits(
    unlockUnitsForOption(option.id, product, returnTo, currentKstYear()),
  );
  const ownedUnits = units.filter((unit) => isUnlockUnitOwned(entitlements, unit));
  const isFullyOwned = units.length > 0 && ownedUnits.length === units.length;
  const creditAmount = isFullyOwned ? option.baseAmount : 0;
  return {
    ...option,
    amount: Math.max(0, option.baseAmount - creditAmount),
    creditAmount,
    ownedLabels: ownedUnits.map((unit) => unit.label),
    ownedCount: ownedUnits.length,
    totalUnits: units.length,
  };
}

function shouldShowCheckoutOption(option: CheckoutOption): boolean {
  if (option.id === "today-pack") {
    return option.ownedCount === 0;
  }
  return true;
}

function unlockUnitsForOption(
  plan: MockPlanId,
  product: string,
  returnTo: string,
  nowYear: number,
): UnlockUnit[] {
  const currentUnit = singleUnlockUnit(product, returnTo, nowYear);
  if (plan === "single") return currentUnit ? [currentUnit] : [];

  const personKey = personKeyFromProduct(product);
  if (plan === "life-pack") {
    return personKey
      ? [
          { key: `saju:${personKey}`, label: "사주바라", scope: { product: "saju", personKey } },
          {
            key: `daewoon:${personKey}:all`,
            label: "전체 대운",
            scopeKey: `daewoon:${personKey}:all`,
          },
          {
            key: `yearly:${personKey}:all`,
            label: "전체 연도별 운세",
            scopeKey: `yearly:${personKey}:all`,
          },
        ]
      : [
          { key: "saju", label: "사주바라", scope: { product: "saju" } },
          { key: "daewoon:all", label: "전체 대운", scopeKey: "daewoon:all" },
          { key: "yearly:all", label: "전체 연도별 운세", scopeKey: "yearly:all" },
        ];
  }

  const baseUnits: UnlockUnit[] = personKey
    ? [
        { key: `saju:${personKey}`, label: "사주바라", scope: { product: "saju", personKey } },
        {
          key: `daewoon:${personKey}:current`,
          label: "현재 대운",
          scope: { product: "daewoon", period: "current", personKey },
        },
        {
          key: `yearly:${personKey}:${nowYear}`,
          label: `${nowYear}년 운세`,
          scope: { product: "yearly", year: nowYear, personKey },
        },
      ]
    : [
        { key: "saju", label: "사주바라", scope: { product: "saju" } },
        { key: "daewoon:current", label: "현재 대운", scope: { product: "daewoon", period: "current" } },
        { key: `yearly:${nowYear}`, label: `${nowYear}년 운세`, scope: { product: "yearly", year: nowYear } },
      ];

  return currentUnit ? [...baseUnits, currentUnit] : baseUnits;
}

function isUnlockUnitOwned(
  entitlements: MockEntitlements,
  unit: UnlockUnit,
): boolean {
  if (unit.scopeKey) return entitlements.scopes.includes(unit.scopeKey);
  return unit.scope ? isScopeUnlocked(entitlements, unit.scope) : false;
}

function singleUnlockUnit(
  product: string,
  returnTo: string,
  nowYear: number,
): UnlockUnit | undefined {
  const parts = product.split(":");
  const kind = parts[0];
  const personKey = parts.length >= 2 && parts[1] ? parts[1] : undefined;

  if (kind === "saju") {
    return {
      key: personKey ? `saju:${personKey}` : "saju",
      label: "사주바라",
      scope: personKey ? { product: "saju", personKey } : { product: "saju" },
    };
  }

  if (kind === "yearly") {
    const year = parseNumber(parts[2]) ?? yearFromReturnTo(returnTo) ?? nowYear;
    return {
      key: personKey ? `yearly:${personKey}:${year}` : `yearly:${year}`,
      label: `${year}년 운세`,
      scope: personKey
        ? { product: "yearly", year, personKey }
        : { product: "yearly", year },
    };
  }

  if (kind === "daewoon") {
    const rawPeriod = parts[2] ?? daewoonIndexFromReturnTo(returnTo) ?? "current";
    const period = rawPeriod === "current" ? "current" : parseNumber(rawPeriod);
    const safePeriod = period ?? "current";
    const label = safePeriod === "current" ? "현재 대운" : `${safePeriod}번째 대운`;
    return {
      key: personKey ? `daewoon:${personKey}:${safePeriod}` : `daewoon:${safePeriod}`,
      label,
      scope: personKey
        ? { product: "daewoon", period: safePeriod, personKey }
        : { product: "daewoon", period: safePeriod },
    };
  }

  if (kind === "daily") {
    return {
      key: product,
      label: "하루 운세",
      scope: { product: "daily", key: product },
    };
  }

  return undefined;
}

function uniqueUnlockUnits(units: UnlockUnit[]): UnlockUnit[] {
  return [...new Map(units.map((unit) => [unit.key, unit])).values()];
}

function personKeyFromProduct(product: string): string | undefined {
  const parts = product.split(":");
  if (parts.length < 2) return undefined;
  if (parts[0] !== "saju" && parts[0] !== "daewoon" && parts[0] !== "yearly") {
    return undefined;
  }
  return parts[1] || undefined;
}

function parseNumber(value: string | undefined): number | undefined {
  if (!value || !/^\d+$/.test(value)) return undefined;
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : undefined;
}

function yearFromReturnTo(returnTo: string): number | undefined {
  try {
    const url = new URL(returnTo, "http://sajubara.local");
    return parseNumber(url.pathname.match(/^\/yearly\/(\d{4})$/)?.[1]);
  } catch {
    return undefined;
  }
}

function daewoonIndexFromReturnTo(returnTo: string): string | undefined {
  try {
    const url = new URL(returnTo, "http://sajubara.local");
    return url.searchParams.get("index") ?? undefined;
  } catch {
    return undefined;
  }
}
