"use client";

import type { ReactNode } from "react";
import { LocalizedValue } from "@/app/components/LanguageProvider";
import { BUSINESS_INFO } from "@/lib/business-info";

export default function BusinessInfoPanel({
  compact = false,
}: {
  compact?: boolean;
}) {
  return (
    <section
      className={
        compact
          ? "text-[10px] font-semibold leading-relaxed text-sb-ink-3 opacity-75"
          : "rounded-sb-lg bg-sb-paper px-4 py-4 text-[12px] font-semibold leading-relaxed text-sb-ink-2"
      }
      style={
        compact
          ? undefined
          : {
              boxShadow: "var(--shadow-sb-card), inset 0 0 0 1px rgba(91,74,54,0.06)",
            }
      }
    >
      <p className={compact ? "sr-only" : "text-[15px] font-extrabold text-sb-ink"}>
        <LocalizedValue ko="사업자 정보" en="Business Information" />
      </p>
      <dl className={compact ? "mt-0 grid grid-cols-[auto_1fr] gap-x-1.5 gap-y-0.5" : "mt-2 grid grid-cols-[auto_1fr] gap-x-2 gap-y-1.5"}>
        <BusinessInfoRow label={{ ko: "서비스명", en: "Service" }} value={BUSINESS_INFO.serviceName} />
        <BusinessInfoRow label={{ ko: "상호", en: "Seller" }} value={BUSINESS_INFO.sellerName} />
        <BusinessInfoRow label={{ ko: "대표자", en: "Representative" }} value={BUSINESS_INFO.representativeName} />
        <BusinessInfoRow
          label={{ ko: "사업자등록번호", en: "Business registration no." }}
          value={BUSINESS_INFO.businessRegistrationNumber}
        />
        <BusinessInfoRow label={{ ko: "주소", en: "Address" }} value={BUSINESS_INFO.address} />
        <BusinessInfoRow
          label={{ ko: "전화", en: "Phone" }}
          value={
            <a href={`tel:${BUSINESS_INFO.phone.replaceAll("-", "")}`} className="underline underline-offset-2">
              {BUSINESS_INFO.phone}
            </a>
          }
        />
        <BusinessInfoRow
          label={{ ko: "호스팅", en: "Hosting" }}
          value={BUSINESS_INFO.hostingProvider}
        />
      </dl>
    </section>
  );
}

function BusinessInfoRow({
  label,
  value,
}: {
  label: { ko: string; en: string };
  value: ReactNode;
}) {
  return (
    <div className="contents">
      <dt className="text-sb-ink-3">
        <LocalizedValue ko={label.ko} en={label.en} />
      </dt>
      <dd className="min-w-0 break-keep text-sb-ink-2">{value}</dd>
    </div>
  );
}
