import Link from "next/link";
import { dailyTarotCard } from "@/lib/bara/daily";

export default function DailyTarotCard() {
  const card = dailyTarotCard();
  return (
    <section className="px-4 pt-1 pb-4">
      <Link
        href="/tarot"
        className="block sb-theme-pastel rounded-sb-lg p-4 active:scale-[0.99] transition-transform"
        style={{
          background: "linear-gradient(135deg, #FFF0FA 0%, #F4ECFF 100%)",
          boxShadow: "0 8px 24px rgba(180,160,220,0.18), inset 0 0 0 1px rgba(110,91,196,0.12)",
        }}
      >
        <div className="flex items-center gap-3">
          <div
            className="w-14 h-20 rounded-md flex items-center justify-center text-[28px] shrink-0 relative"
            style={{
              background: "linear-gradient(160deg, #C7B8FF 0%, #6E5BC4 100%)",
              boxShadow: "0 4px 12px rgba(110,91,196,0.35)",
              color: "white",
            }}
            aria-hidden
          >
            <div
              className="absolute inset-1 rounded-sm"
              style={{ border: "1px solid rgba(255,255,255,0.4)" }}
            />
            <span className="relative">✦</span>
          </div>
          <div className="flex-1 min-w-0">
            <div className="text-[10.5px] font-extrabold tracking-wider uppercase mb-1" style={{ color: "#6E5BC4" }}>
              오늘의 카드 한 장
            </div>
            <h3 className="text-[15px] font-extrabold leading-snug tracking-tight" style={{ color: "#2E2A3A" }}>
              {card.nameKr} <span className="text-[12px] font-bold opacity-70">{card.name}</span>
            </h3>
            <p className="text-[12px] mt-0.5" style={{ color: "#5A5468" }}>
              {card.meaning}
            </p>
          </div>
          <svg width="10" height="10" viewBox="0 0 10 10" fill="none" aria-hidden>
            <path
              d="M3.5 2L6.5 5L3.5 8"
              stroke="#6E5BC4"
              strokeWidth="1.8"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        </div>
      </Link>
    </section>
  );
}
