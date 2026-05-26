import { BARA_CARDS } from "@/lib/bara/cards";
import BaraCardView from "./BaraCard";

const RECOMMEND_IDS = [
  "fire-horse",
  "wood-rabbit",
  "water-rat",
  "earth-ox",
  "metal-monkey",
];

export default function RecommendCarousel() {
  const cards = RECOMMEND_IDS.map((id) => BARA_CARDS.find((c) => c.id === id)).filter(
    (c): c is NonNullable<typeof c> => !!c,
  );

  return (
    <section className="pt-1 pb-4">
      <div className="flex items-baseline justify-between px-5 mb-2.5">
        <h2 className="text-[14px] font-extrabold text-sb-ink tracking-tight">인기 비유 카드</h2>
        <span className="text-[11px] font-semibold text-sb-ink-3">60장 중 5장</span>
      </div>
      <div
        className="flex gap-2.5 overflow-x-auto px-4"
        style={{ scrollSnapType: "x mandatory", scrollbarWidth: "none" }}
      >
        {cards.map((card) => (
          <div key={card.id} style={{ scrollSnapAlign: "start" }}>
            <BaraCardView card={card} variant="compact" />
          </div>
        ))}
      </div>
    </section>
  );
}
