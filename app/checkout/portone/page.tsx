import PortOneCheckoutClient from "./PortOneCheckoutClient";
import { redirect } from "next/navigation";
import { sanitizeReturnTo } from "@/lib/payments/checkout";
import { readCurrentUserEntitlementSnapshot } from "@/lib/payments/server-ledger";
import { createSupabaseServerClient } from "@/lib/supabase/server";

type SearchParams = Promise<{
  amount?: string;
  product?: string;
  returnTo?: string;
  title?: string;
}>;

export default async function PortOneCheckoutPage({
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
    <PortOneCheckoutClient
      amount={safeAmount}
      channelKey={process.env.NEXT_PUBLIC_PORTONE_CHANNEL_KEY ?? ""}
      initialEntitlements={initialEntitlements}
      payMethod={process.env.NEXT_PUBLIC_PORTONE_PAY_METHOD ?? "CARD"}
      product={sp.product ?? "saju"}
      returnTo={returnTo}
      storeId={process.env.NEXT_PUBLIC_PORTONE_STORE_ID ?? ""}
      title={sp.title ?? "바라사주 전체 해설"}
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
  return qs ? `/checkout/portone?${qs}` : "/checkout/portone";
}
