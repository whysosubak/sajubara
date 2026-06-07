import "server-only";

import { canViewPaidContent } from "@/lib/auth/paid";
import { sajuPersonKey, sajuPersonProduct } from "@/lib/saju/scope";
import {
  currentKstYear,
  reportCheckoutHref,
  reportDaewoonHref,
  reportSajuHref,
  reportYearlyHref,
} from "@/lib/saju/report-links";
import type { SajuInput } from "@/lib/saju/types";

export type ReportAccessItem = {
  key: "saju" | "daewoon" | "yearly";
  icon: string;
  title: string;
  description: string;
  href: string;
  checkoutHref: string;
  unlocked: boolean;
};

export async function buildReportAccessItems(
  input: SajuInput,
  year = currentKstYear(),
): Promise<ReportAccessItem[]> {
  const personKey = sajuPersonKey(input);
  const [sajuUnlocked, daewoonUnlocked, yearlyUnlocked] = await Promise.all([
    canViewPaidContent(false, { product: "saju", personKey }),
    canViewPaidContent(false, { product: "daewoon", period: "current", personKey }),
    canViewPaidContent(false, { product: "yearly", year, personKey }),
  ]);

  const sajuHref = reportSajuHref(input, true);
  const daewoonHref = reportDaewoonHref(input, true);
  const yearlyHref = reportYearlyHref(input, year, true);

  return [
    {
      key: "saju",
      icon: "🌿",
      title: "바라사주 전체 해설",
      description: "성격·재물·관계·그림자 카드",
      href: sajuHref,
      checkoutHref: reportCheckoutHref({
        product: sajuPersonProduct(input),
        title: "바라사주 전체 해설",
        returnTo: sajuHref,
      }),
      unlocked: sajuUnlocked,
    },
    {
      key: "daewoon",
      icon: "🌊",
      title: "현재 10년 대운",
      description: "지금 들어온 큰 흐름과 5대 핵심",
      href: daewoonHref,
      checkoutHref: reportCheckoutHref({
        product: `daewoon:${personKey}:current`,
        title: "현재 10년 대운 상세",
        returnTo: daewoonHref,
      }),
      unlocked: daewoonUnlocked,
    },
    {
      key: "yearly",
      icon: "📅",
      title: `${year}년 연도별 운세`,
      description: "12개월·6대 운세·시크릿 솔루션",
      href: yearlyHref,
      checkoutHref: reportCheckoutHref({
        product: `yearly:${personKey}:${year}`,
        title: `${year}년 전체 해설`,
        returnTo: yearlyHref,
      }),
      unlocked: yearlyUnlocked,
    },
  ];
}
