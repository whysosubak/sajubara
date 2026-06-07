import MockCheckoutClient from "./MockCheckoutClient";
import { redirect } from "next/navigation";
import { readCurrentUserEntitlementSnapshot } from "@/lib/payments/server-ledger";
import { createSupabaseServerClient } from "@/lib/supabase/server";

type SearchParams = Promise<{
  amount?: string;
  product?: string;
  returnTo?: string;
  title?: string;
}>;

export default async function MockCheckoutPage({
  searchParams,
}: {
  searchParams: SearchParams;
}) {
  const sp = await searchParams;
  const amount = Number(sp.amount ?? "990");
  const safeAmount = Number.isFinite(amount) && amount > 0 ? amount : 990;
  const returnTo = sanitizeReturnTo(sp.returnTo);
  const currentPath = buildCurrentPath(sp);
  const user = await readCurrentUser();
  if (!user) {
    redirect(`/login?next=${encodeURIComponent(currentPath)}`);
  }
  const initialEntitlements = await readCurrentUserEntitlementSnapshot();

  return (
    <MockCheckoutClient
      amount={safeAmount}
      initialEntitlements={initialEntitlements}
      product={sp.product ?? "saju"}
      returnTo={returnTo}
      title={sp.title ?? "사주바라 전체 해설"}
    />
  );
}

async function readCurrentUser() {
  try {
    const supabase = await createSupabaseServerClient();
    const { data } = await supabase.auth.getUser();
    return data.user ?? null;
  } catch {
    return null;
  }
}

function buildCurrentPath(sp: Awaited<SearchParams>): string {
  const params = new URLSearchParams();
  if (sp.amount) params.set("amount", sp.amount);
  if (sp.product) params.set("product", sp.product);
  if (sp.returnTo) params.set("returnTo", sp.returnTo);
  if (sp.title) params.set("title", sp.title);
  const qs = params.toString();
  return qs ? `/checkout/mock?${qs}` : "/checkout/mock";
}

function sanitizeReturnTo(value?: string): string {
  if (!value) return "/";
  if (!value.startsWith("/") || value.startsWith("//")) return "/";
  if (value.includes("\n") || value.includes("\r")) return "/";
  return value;
}
