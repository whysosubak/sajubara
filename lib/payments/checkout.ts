export type CheckoutParams = {
  amount?: number | string;
  product: string;
  returnTo: string;
  title: string;
};

export type CheckoutMode = "mock" | "portone";

export function checkoutMode(): CheckoutMode {
  return process.env.NEXT_PUBLIC_CHECKOUT_MODE === "portone" ? "portone" : "mock";
}

export function checkoutBasePath(): "/checkout/mock" | "/checkout/portone" {
  return checkoutMode() === "portone" ? "/checkout/portone" : "/checkout/mock";
}

export function checkoutHref({
  amount = 990,
  product,
  returnTo,
  title,
}: CheckoutParams): string {
  const params = new URLSearchParams({
    amount: String(amount),
    product,
    returnTo,
    title,
  });
  return `${checkoutBasePath()}?${params.toString()}`;
}

export function sanitizeReturnTo(value?: string): string {
  if (!value) return "/";
  if (!value.startsWith("/") || value.startsWith("//")) return "/";
  if (value.includes("\n") || value.includes("\r")) return "/";
  return value;
}

export function appendPaidParamsToReturnTo({
  amount,
  plan,
  returnTo,
}: {
  amount: number;
  plan: string;
  returnTo: string;
}): string {
  try {
    const url = new URL(returnTo, "http://sajubara.local");
    url.searchParams.set("paid", "1");
    url.searchParams.set("plan", plan);
    url.searchParams.set("amount", String(amount));
    return `${url.pathname}?${url.searchParams.toString()}${url.hash}`;
  } catch {
    return returnTo;
  }
}
