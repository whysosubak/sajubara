"use client";

import Link from "next/link";

type ContentDisclaimerProps = {
  compact?: boolean;
  className?: string;
};

export default function ContentDisclaimer({
  compact = false,
  className = "",
}: ContentDisclaimerProps) {
  return (
    <section
      className={`rounded-sb-lg bg-sb-paper ${compact ? "px-4 py-3" : "px-4 py-4"} ${className}`}
      style={{
        boxShadow: "var(--shadow-sb-card), inset 0 0 0 1px rgba(91,74,54,0.06)",
      }}
    >
      <div className="text-[10.5px] font-extrabold uppercase tracking-[0.14em] text-sb-olive-light">
        참고용 콘텐츠 안내
      </div>
      <p className="mt-1.5 text-[11.5px] font-semibold leading-relaxed text-sb-ink-2">
        사주바라의 사주·운세·컬러수비학 결과는 입력 정보와 명식 해석, 생성형 AI를 바탕으로 만든 참고용 콘텐츠입니다. 의학·법률·재무·투자 등 전문 판단을 대체하지 않습니다.
      </p>
      <div className="mt-2 flex flex-wrap justify-center gap-x-3 gap-y-1 text-[10.5px] font-extrabold text-sb-ink-3">
        <Link href="/terms" className="underline underline-offset-2">
          이용약관
        </Link>
        <Link href="/privacy" className="underline underline-offset-2">
          개인정보처리방침
        </Link>
        <Link href="/refund" className="underline underline-offset-2">
          환불정책
        </Link>
      </div>
    </section>
  );
}
