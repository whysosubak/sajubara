import "server-only";

import { cookies } from "next/headers";
import {
  MOCK_ENTITLEMENT_COOKIE,
  isScopeUnlocked,
  parseMockEntitlements,
  scopeKeysForAccess,
  type PaidContentScope,
} from "@/lib/auth/mock-entitlements";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export async function canViewPaidContent(
  requestedPaid: boolean,
  scope?: PaidContentScope,
): Promise<boolean> {
  try {
    const supabase = await createSupabaseServerClient();
    const { data } = await supabase.auth.getUser();
    if (!data.user) return false;
    if (!scope) return process.env.NODE_ENV !== "production" && requestedPaid;

    const scopeKeys = scopeKeysForAccess(scope);
    const { data: rows, error } = await supabase
      .from("entitlements")
      .select("scope_key")
      .in("scope_key", scopeKeys)
      .limit(1);

    if (!error && Array.isArray(rows) && rows.length > 0) {
      return true;
    }

    const cookieStore = await cookies();
    const entitlements = parseMockEntitlements(
      cookieStore.get(MOCK_ENTITLEMENT_COOKIE)?.value,
    );
    return isScopeUnlocked(entitlements, scope);
  } catch {
    return false;
  }
}
