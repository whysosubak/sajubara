import "server-only";

import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import {
  emptyMockEntitlements,
  mergeMockEntitlements,
  scopeKeysForMockPurchase,
  yuzuCountFromProduct,
  type MockEntitlements,
  type MockPlanId,
  type YuzuLedgerEntry,
  type YuzuLedgerEntryType,
} from "@/lib/auth/mock-entitlements";
import { createSupabaseServerClient } from "@/lib/supabase/server";

type RecordVerifiedPaymentLedgerInput = {
  amount: number;
  metadata?: Record<string, unknown>;
  nowYear: number;
  paymentId: string;
  plan: MockPlanId;
  product: string;
  provider?: string;
  returnTo: string;
  userId: string;
};

export type RecordVerifiedPaymentLedgerResult =
  | { ok: true; orderId: string }
  | { ok: false; reason: string };

type EntitlementRow = {
  scope_key: string;
};

type YuzuLedgerRow = {
  amount_krw: number | null;
  created_at: string | null;
  entry_type: string | null;
  product: string | null;
  scope_key: string | null;
  yuzu_delta: number | null;
};

let cachedAdminClient: SupabaseClient | null = null;

function getLedgerAdminClient(): SupabaseClient | null {
  if (cachedAdminClient) return cachedAdminClient;
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) return null;
  cachedAdminClient = createClient(url, key, {
    auth: { persistSession: false },
  });
  return cachedAdminClient;
}

export async function readCurrentUserEntitlementSnapshot(): Promise<MockEntitlements> {
  try {
    const supabase = await createSupabaseServerClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) return emptyMockEntitlements();

    const [entitlementResult, ledgerResult] = await Promise.all([
      supabase
        .from("entitlements")
        .select("scope_key")
        .eq("user_id", user.id),
      supabase
        .from("yuzu_ledger")
        .select("entry_type,yuzu_delta,amount_krw,product,scope_key,created_at")
        .eq("user_id", user.id)
        .order("created_at", { ascending: true })
        .limit(120),
    ]);

    const scopes = entitlementRows(entitlementResult.data);
    const yuzuLedger = yuzuLedgerRows(ledgerResult.data);

    return mergeMockEntitlements({
      version: 1,
      scopes,
      purchases: [],
      yuzuLedger,
    });
  } catch {
    return emptyMockEntitlements();
  }
}

export async function recordVerifiedPaymentLedger({
  amount,
  metadata = {},
  nowYear,
  paymentId,
  plan,
  product,
  provider = "portone",
  returnTo,
  userId,
}: RecordVerifiedPaymentLedgerInput): Promise<RecordVerifiedPaymentLedgerResult> {
  const client = getLedgerAdminClient();
  if (!client) {
    return { ok: false, reason: "SUPABASE_SERVICE_ROLE_KEY missing" };
  }

  const orderId = `${provider}:${paymentId}`;
  const paidAt = new Date().toISOString();
  const yuzuAmount = yuzuCountFromProduct(product);
  const scopeKeys =
    yuzuAmount > 0 ? [] : scopeKeysForMockPurchase({ plan, product, returnTo, nowYear });

  const { error: orderError } = await client
    .from("payment_orders")
    .upsert(
      {
        amount_krw: amount,
        metadata: { ...metadata, scopeKeys },
        order_id: orderId,
        paid_at: paidAt,
        payment_id: paymentId,
        plan,
        product,
        provider,
        return_to: returnTo,
        status: "paid",
        updated_at: paidAt,
        user_id: userId,
        yuzu_amount: yuzuAmount,
      },
      { onConflict: "order_id" },
    );

  if (orderError) return { ok: false, reason: orderError.message };

  if (yuzuAmount > 0) {
    const yuzuResult = await persistYuzuCharge({
      amount,
      client,
      metadata,
      orderId,
      product,
      userId,
      yuzuAmount,
    });
    if (!yuzuResult.ok) return yuzuResult;
    return { ok: true, orderId };
  }

  const entitlementResult = await persistEntitlements({
    client,
    metadata,
    orderId,
    scopeKeys,
    userId,
  });
  if (!entitlementResult.ok) return entitlementResult;

  return { ok: true, orderId };
}

function entitlementRows(value: unknown): string[] {
  if (!Array.isArray(value)) return [];
  return value
    .map((row) => (row as Partial<EntitlementRow>).scope_key)
    .filter((scope): scope is string => typeof scope === "string" && scope.length > 0);
}

function yuzuLedgerRows(value: unknown): YuzuLedgerEntry[] {
  if (!Array.isArray(value)) return [];
  return value
    .map((row) => row as Partial<YuzuLedgerRow>)
    .map((row): YuzuLedgerEntry | null => {
      const type = parseYuzuLedgerEntryType(row.entry_type);
      if (!type || typeof row.yuzu_delta !== "number") return null;
      return {
        amount: typeof row.amount_krw === "number" ? row.amount_krw : 0,
        at: typeof row.created_at === "string" ? row.created_at : new Date().toISOString(),
        product: typeof row.product === "string" ? row.product : undefined,
        scope: typeof row.scope_key === "string" ? row.scope_key : undefined,
        type,
        yuzuDelta: row.yuzu_delta,
      };
    })
    .filter((entry): entry is YuzuLedgerEntry => Boolean(entry));
}

function parseYuzuLedgerEntryType(value: unknown): YuzuLedgerEntryType | null {
  if (
    value === "charge" ||
    value === "spend" ||
    value === "grant" ||
    value === "refund" ||
    value === "adjust"
  ) {
    return value;
  }
  return null;
}

async function persistYuzuCharge({
  amount,
  client,
  metadata,
  orderId,
  product,
  userId,
  yuzuAmount,
}: {
  amount: number;
  client: SupabaseClient;
  metadata: Record<string, unknown>;
  orderId: string;
  product: string;
  userId: string;
  yuzuAmount: number;
}): Promise<RecordVerifiedPaymentLedgerResult> {
  const { data: existingLedger, error: existingLedgerError } = await client
    .from("yuzu_ledger")
    .select("id")
    .eq("order_id", orderId)
    .maybeSingle();

  if (existingLedgerError) return { ok: false, reason: existingLedgerError.message };
  if (existingLedger) return { ok: true, orderId };

  const { error: ledgerError } = await client.from("yuzu_ledger").insert({
    amount_krw: amount,
    entry_type: "charge",
    metadata,
    order_id: orderId,
    product,
    user_id: userId,
    yuzu_delta: yuzuAmount,
  });

  if (ledgerError) return { ok: false, reason: ledgerError.message };

  const { error: walletError } = await client.rpc("increment_yuzu_wallet", {
    bonus_delta: 0,
    paid_delta: yuzuAmount,
    target_user_id: userId,
  });

  if (walletError) return { ok: false, reason: walletError.message };
  return { ok: true, orderId };
}

async function persistEntitlements({
  client,
  metadata,
  orderId,
  scopeKeys,
  userId,
}: {
  client: SupabaseClient;
  metadata: Record<string, unknown>;
  orderId: string;
  scopeKeys: string[];
  userId: string;
}): Promise<RecordVerifiedPaymentLedgerResult> {
  if (scopeKeys.length === 0) return { ok: true, orderId };
  const rows = scopeKeys.map((scopeKey) => ({
    metadata,
    order_id: orderId,
    person_key: personKeyFromScopeKey(scopeKey),
    product: productFromScopeKey(scopeKey),
    scope_key: scopeKey,
    source_type: "purchase",
    user_id: userId,
  }));

  const { error } = await client
    .from("entitlements")
    .upsert(rows, { onConflict: "user_id,scope_key" });

  if (error) return { ok: false, reason: error.message };
  return { ok: true, orderId };
}

function productFromScopeKey(scopeKey: string): string {
  return scopeKey.split(":")[0] || "unknown";
}

function personKeyFromScopeKey(scopeKey: string): string {
  const parts = scopeKey.split(":");
  const kind = parts[0];
  const maybePerson = parts[1];
  if (!maybePerson) return "legacy";
  if (kind === "saju" && maybePerson !== "all") return maybePerson;
  if ((kind === "daewoon" || kind === "yearly" || kind === "daily") && !isReservedScopePart(maybePerson)) {
    return maybePerson;
  }
  return "legacy";
}

function isReservedScopePart(value: string): boolean {
  return value === "all" || value === "current" || /^\d+$/.test(value);
}
