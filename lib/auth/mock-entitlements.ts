export const MOCK_ENTITLEMENT_COOKIE = "barasaju_mock_entitlements";

export type MockPlanId = "single" | "today-pack" | "life-pack";
export type MockProduct = "saju" | "daewoon" | "yearly" | "daily";

export type PaidContentScope =
  | { product: "saju"; personKey?: string }
  | { product: "daewoon"; period: "current" | number; personKey?: string }
  | { product: "yearly"; year: number; personKey?: string }
  | { product: "daily"; key: string };

export type MockEntitlements = {
  version: 1;
  scopes: string[];
  purchases: Array<{
    plan: MockPlanId;
    product: string;
    amount: number;
    at: string;
  }>;
  yuzuLedger: YuzuLedgerEntry[];
};

export type YuzuLedgerEntryType = "charge" | "spend" | "grant" | "refund" | "adjust";

export type YuzuLedgerEntry = {
  type: YuzuLedgerEntryType;
  yuzuDelta: number;
  amount: number;
  product?: string;
  scope?: string;
  plan?: MockPlanId;
  at: string;
};

export function emptyMockEntitlements(): MockEntitlements {
  return { version: 1, scopes: [], purchases: [], yuzuLedger: [] };
}

export function mergeMockEntitlements(
  ...values: Array<Partial<MockEntitlements> | undefined>
): MockEntitlements {
  const normalized = values
    .filter((value): value is Partial<MockEntitlements> => Boolean(value))
    .map((value) => normalizeMockEntitlements(value));
  const scopes = new Set<string>();
  const purchases: MockEntitlements["purchases"] = [];
  const yuzuLedger: YuzuLedgerEntry[] = [];

  normalized.forEach((value) => {
    value.scopes.forEach((scope) => scopes.add(scope));
    purchases.push(...value.purchases);
    yuzuLedger.push(...value.yuzuLedger);
  });

  return normalizeMockEntitlements({
    version: 1,
    scopes: [...scopes],
    purchases: purchases.slice(-40),
    yuzuLedger: yuzuLedger.slice(-120),
  });
}

export function parseMockEntitlements(value?: string): MockEntitlements {
  if (!value) return emptyMockEntitlements();
  try {
    const decoded = decodeURIComponent(value);
    const parsed = JSON.parse(decoded) as Partial<MockEntitlements>;
    return normalizeMockEntitlements(parsed);
  } catch {
    try {
      const parsed = JSON.parse(value) as Partial<MockEntitlements>;
      return normalizeMockEntitlements(parsed);
    } catch {
      return emptyMockEntitlements();
    }
  }
}

export function serializeMockEntitlements(entitlements: MockEntitlements): string {
  return encodeURIComponent(JSON.stringify(normalizeMockEntitlements(entitlements)));
}

export function isScopeUnlocked(
  entitlements: MockEntitlements,
  scope: PaidContentScope,
): boolean {
  const scopes = new Set(normalizeMockEntitlements(entitlements).scopes);
  if (scopes.has("all")) return true;

  if (scope.product === "saju") {
    if (!scope.personKey && scopes.has("saju")) return true;
    return scope.personKey ? scopes.has(`saju:${scope.personKey}`) : false;
  }

  if (scope.product === "yearly") {
    if (scope.personKey) {
      return (
        scopes.has(`yearly:${scope.personKey}:all`) ||
        scopes.has(`yearly:${scope.personKey}:${scope.year}`)
      );
    }
    return scopes.has("yearly:all") || scopes.has(`yearly:${scope.year}`);
  }

  if (scope.product === "daewoon") {
    if (scope.personKey) {
      if (scopes.has(`daewoon:${scope.personKey}:all`)) return true;
      if (scope.period === "current") return scopes.has(`daewoon:${scope.personKey}:current`);
      return scopes.has(`daewoon:${scope.personKey}:${scope.period}`);
    }
    if (scopes.has("daewoon:all")) return true;
    if (scope.period === "current") return scopes.has("daewoon:current");
    return scopes.has(`daewoon:${scope.period}`);
  }

  if (scope.product === "daily") {
    return scopes.has(scope.key);
  }

  return false;
}

export function mergeMockPurchase({
  current,
  plan,
  product,
  amount,
  returnTo,
  nowYear,
}: {
  current: MockEntitlements;
  plan: MockPlanId;
  product: string;
  amount: number;
  returnTo: string;
  nowYear: number;
}): MockEntitlements {
  const normalized = normalizeMockEntitlements(current);
  const scopes = new Set(normalized.scopes);
  scopesForMockPurchase({ plan, product, returnTo, nowYear }).forEach((scope) =>
    scopes.add(scope),
  );
  const at = new Date().toISOString();

  return normalizeMockEntitlements({
    version: 1,
    scopes: [...scopes],
    purchases: [
      ...normalized.purchases,
      { plan, product, amount, at },
    ].slice(-40),
    yuzuLedger: [
      ...normalized.yuzuLedger,
      ...yuzuLedgerEntriesForPurchase({ plan, product, amount, at }),
    ].slice(-120),
  });
}

export function calculateYuzuBalance(entitlements: MockEntitlements): number {
  return normalizeMockEntitlements(entitlements).yuzuLedger.reduce(
    (sum, entry) => sum + entry.yuzuDelta,
    0,
  );
}

export function calculateYuzuPaidTotal(entitlements: MockEntitlements): number {
  return normalizeMockEntitlements(entitlements).yuzuLedger.reduce((sum, entry) => {
    if (entry.type !== "charge") return sum;
    return sum + Math.max(0, entry.amount);
  }, 0);
}

export function yuzuCountFromProduct(product: string): number {
  const match = product.match(/^yuzu:(\d+)$/);
  if (!match) return 0;
  const count = Number(match[1]);
  return Number.isFinite(count) ? count : 0;
}

export function scopeKeyForPaidContent(scope: PaidContentScope): string {
  if (scope.product === "saju") {
    return scope.personKey ? `saju:${scope.personKey}` : "saju";
  }
  if (scope.product === "yearly") {
    return scope.personKey
      ? `yearly:${scope.personKey}:${scope.year}`
      : `yearly:${scope.year}`;
  }
  if (scope.product === "daewoon") {
    return scope.personKey
      ? `daewoon:${scope.personKey}:${scope.period}`
      : `daewoon:${scope.period}`;
  }
  return scope.key;
}

export function scopeKeysForAccess(scope: PaidContentScope): string[] {
  const keys = new Set<string>([scopeKeyForPaidContent(scope), "all"]);

  if (scope.product === "saju") {
    if (scope.personKey) keys.add("saju");
    return [...keys];
  }

  if (scope.product === "yearly") {
    if (scope.personKey) {
      keys.add(`yearly:${scope.personKey}:all`);
      keys.add(`yearly:${scope.year}`);
    }
    keys.add("yearly:all");
    return [...keys];
  }

  if (scope.product === "daewoon") {
    if (scope.personKey) {
      keys.add(`daewoon:${scope.personKey}:all`);
    }
    keys.add("daewoon:all");
    return [...keys];
  }

  return [...keys];
}

export function scopeKeysForMockPurchase({
  plan,
  product,
  returnTo,
  nowYear,
}: {
  plan: MockPlanId;
  product: string;
  returnTo: string;
  nowYear: number;
}): string[] {
  return scopesForMockPurchase({ plan, product, returnTo, nowYear });
}

export function personKeyFromPaidProduct(product: string): string | undefined {
  return personKeyFromProduct(product);
}

function scopesForMockPurchase({
  plan,
  product,
  returnTo,
  nowYear,
}: {
  plan: MockPlanId;
  product: string;
  returnTo: string;
  nowYear: number;
}): string[] {
  const subjectKey = personKeyFromProduct(product);
  if (plan === "today-pack") {
    if (subjectKey) {
      return [
        `saju:${subjectKey}`,
        `daewoon:${subjectKey}:current`,
        `yearly:${subjectKey}:${nowYear}`,
        ...singlePurchaseScopes({ product, returnTo, nowYear }),
      ];
    }
    return ["saju", "daewoon:current", `yearly:${nowYear}`, ...singlePurchaseScopes({ product, returnTo, nowYear })];
  }

  if (plan === "life-pack") {
    if (subjectKey) return [`saju:${subjectKey}`, `daewoon:${subjectKey}:all`, `yearly:${subjectKey}:all`];
    return ["saju", "daewoon:all", "yearly:all"];
  }

  return singlePurchaseScopes({ product, returnTo, nowYear });
}

function singlePurchaseScopes({
  product,
  returnTo,
  nowYear,
}: {
  product: string;
  returnTo: string;
  nowYear: number;
}): string[] {
  if (product.startsWith("saju:")) return [product];
  if (product.startsWith("daewoon:")) return [product];
  if (product.startsWith("yearly:")) return [product];
  if (product.startsWith("daily:")) return [product];
  if (product === "saju") return ["saju"];
  if (product === "yearly") return [`yearly:${yearFromReturnTo(returnTo) ?? nowYear}`];
  if (product === "daewoon") {
    const index = daewoonIndexFromReturnTo(returnTo);
    return [index === undefined ? "daewoon:current" : `daewoon:${index}`];
  }
  return [];
}

function personKeyFromProduct(product: string): string | undefined {
  const parts = product.split(":");
  if (parts.length < 2) return undefined;
  if (parts[0] !== "saju" && parts[0] !== "daewoon" && parts[0] !== "yearly") {
    return undefined;
  }
  return parts[1] || undefined;
}

function yuzuLedgerEntriesForPurchase({
  plan,
  product,
  amount,
  at,
}: {
  plan: MockPlanId;
  product: string;
  amount: number;
  at: string;
}): YuzuLedgerEntry[] {
  const count = yuzuCountFromProduct(product);
  if (count <= 0) return [];
  return [
    {
      type: "charge",
      yuzuDelta: count,
      amount,
      product,
      plan,
      at,
    },
  ];
}

function normalizeMockEntitlements(value: Partial<MockEntitlements>): MockEntitlements {
  const purchases = Array.isArray(value.purchases)
    ? value.purchases
        .filter(
          (purchase) =>
            typeof purchase?.plan === "string" &&
            typeof purchase?.product === "string" &&
            typeof purchase?.amount === "number" &&
            typeof purchase?.at === "string",
        )
        .slice(-40)
    : [];
  const yuzuLedger = normalizeYuzuLedger(value.yuzuLedger);

  return {
    version: 1,
    scopes: Array.isArray(value.scopes)
      ? [...new Set(value.scopes.filter((scope): scope is string => typeof scope === "string"))]
      : [],
    purchases,
    yuzuLedger: yuzuLedger.length > 0 ? yuzuLedger : migrateYuzuPurchases(purchases),
  };
}

function normalizeYuzuLedger(value: unknown): YuzuLedgerEntry[] {
  if (!Array.isArray(value)) return [];
  return value.filter(isYuzuLedgerEntry).slice(-120);
}

function isYuzuLedgerEntry(value: unknown): value is YuzuLedgerEntry {
  if (!value || typeof value !== "object") return false;
  const entry = value as Partial<YuzuLedgerEntry>;
  return (
    typeof entry.type === "string" &&
    typeof entry.yuzuDelta === "number" &&
    typeof entry.amount === "number" &&
    typeof entry.at === "string"
  );
}

function migrateYuzuPurchases(
  purchases: MockEntitlements["purchases"],
): YuzuLedgerEntry[] {
  const entries: YuzuLedgerEntry[] = [];
  purchases.forEach((purchase) => {
    const count = yuzuCountFromProduct(purchase.product);
    if (count <= 0) return;
    entries.push({
        type: "charge" as const,
        yuzuDelta: count,
        amount: purchase.amount,
        product: purchase.product,
        plan: purchase.plan,
        at: purchase.at,
      });
  });
  return entries.slice(-120);
}

function yearFromReturnTo(returnTo: string): number | undefined {
  try {
    const url = new URL(returnTo, "http://barasaju.local");
    const match = url.pathname.match(/^\/yearly\/(\d{4})$/);
    if (!match) return undefined;
    const year = Number(match[1]);
    return Number.isFinite(year) ? year : undefined;
  } catch {
    return undefined;
  }
}

function daewoonIndexFromReturnTo(returnTo: string): number | undefined {
  try {
    const url = new URL(returnTo, "http://barasaju.local");
    const index = url.searchParams.get("index");
    if (!index || !/^\d+$/.test(index)) return undefined;
    return Number(index);
  } catch {
    return undefined;
  }
}
