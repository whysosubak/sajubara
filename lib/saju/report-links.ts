import type { SajuInput } from "@/lib/saju/types";
import { checkoutHref } from "@/lib/payments/checkout";

export function reportInputParams(input: SajuInput): URLSearchParams {
  const params = new URLSearchParams({
    name: input.name,
    birthDate: input.birthDate,
    birthTime: input.birthTime,
    gender: input.gender,
    calendar: input.calendar,
  });
  if (input.loveStatus) params.set("loveStatus", input.loveStatus);
  if (input.jobStatus) params.set("jobStatus", input.jobStatus);
  return params;
}

export function reportSajuHref(input: SajuInput, paid = false): string {
  const params = reportInputParams(input);
  if (paid) params.set("paid", "1");
  return `/saju/result?${params.toString()}`;
}

export function reportDaewoonHref(input: SajuInput, paid = false): string {
  const params = reportInputParams(input);
  if (paid) params.set("paid", "1");
  return `/daewoon?${params.toString()}`;
}

export function reportYearlyHref(
  input: SajuInput,
  year = currentKstYear(),
  paid = false,
): string {
  const params = reportInputParams(input);
  if (paid) params.set("paid", "1");
  return `/yearly/${year}?${params.toString()}`;
}

export function reportCheckoutHref({
  product,
  title,
  returnTo,
  amount = 990,
}: {
  product: string;
  title: string;
  returnTo: string;
  amount?: number;
}): string {
  return checkoutHref({ amount, product, returnTo, title });
}

export function currentKstYear(): number {
  const year = new Intl.DateTimeFormat("en-US", {
    timeZone: "Asia/Seoul",
    year: "numeric",
  }).format(new Date());
  return Number(year);
}
