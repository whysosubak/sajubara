import Image from "next/image";
import {
  BRANCH_LABEL_KR,
  ELEMENT_COLOR_KR,
  ELEMENT_EMOJI,
  ELEMENT_LABEL_KR,
  type BaraCard,
} from "@/lib/bara/types";
import { isCardWritten } from "@/lib/bara/cards";

export default function BaraCardView({
  card,
  variant = "default",
  bodySlot,
  subjectName,
  kicker,
}: {
  card: BaraCard;
  variant?: "default" | "compact" | "wide";
  bodySlot?: React.ReactNode;
  subjectName?: string;
  kicker?: string;
}) {
  const written = isCardWritten(card);
  const hasImage = !!card.image;
  const isCompact = variant === "compact";
  const isWide = variant === "wide";
  const hasOwnBody = card.body.length > 0;
  const hasBodyContent = !!bodySlot || hasOwnBody;

  // 타이틀: subjectName + 닉네임 있으면 자연어 문장, 없으면 폴백 (오행색 + 동물)
  const renderTitle = () => {
    if (!subjectName || !written) {
      return (
        <h2 className="text-[17px] font-extrabold text-sb-ink tracking-tight leading-snug">
          {written
            ? card.nickname
            : `${ELEMENT_COLOR_KR[card.element]} ${BRANCH_LABEL_KR[card.branch]}`}
        </h2>
      );
    }
    return (
      <h2 className="text-[16px] font-bold text-sb-ink leading-snug tracking-tight">
        {subjectName}님은{" "}
        <strong className="text-sb-olive-dark font-extrabold">
          &lsquo;{card.nickname}&rsquo;
        </strong>{" "}
        같은 에너지를 가지고 있어요
      </h2>
    );
  };

  return (
    <article
      className="bg-sb-paper rounded-sb-lg overflow-hidden shrink-0"
      style={{
        boxShadow: "var(--shadow-sb-card), inset 0 0 0 1px rgba(91,74,54,0.06)",
        width: isCompact ? 220 : undefined,
      }}
    >
      {hasImage ? (
        <div
          className="relative w-full"
          style={{
            background: card.colorTone
              ? `linear-gradient(135deg, ${card.colorTone}40, ${card.colorTone}15)`
              : "linear-gradient(135deg, var(--sb-cream), var(--sb-paper))",
          }}
        >
          <Image
            src={card.image!}
            alt={card.nickname || `${card.element}-${card.branch}`}
            width={1122}
            height={1402}
            sizes={isCompact ? "220px" : "(max-width: 420px) 100vw, 420px"}
            className="w-full h-auto block"
            priority={variant === "wide"}
          />
        </div>
      ) : (
        <div
          className="px-4 pt-4 pb-3"
          style={{
            background: card.colorTone
              ? `linear-gradient(135deg, ${card.colorTone}30, ${card.colorTone}10)`
              : "linear-gradient(135deg, var(--sb-cream), var(--sb-paper))",
          }}
        >
          <div className="flex items-start gap-2.5">
            <div
              className="w-10 h-10 rounded-sb-md flex items-center justify-center text-[24px] shrink-0"
              style={{ background: "var(--sb-cream)" }}
              aria-hidden
            >
              {ELEMENT_EMOJI[card.element]}
            </div>
            <h2 className="text-[15px] font-extrabold text-sb-ink tracking-tight leading-snug pt-0.5">
              {written
                ? card.nickname
                : `${ELEMENT_LABEL_KR[card.element]} ${BRANCH_LABEL_KR[card.branch]}`}
            </h2>
          </div>
        </div>
      )}

      {hasImage && (
        <div
          className={`${isWide ? "px-5" : "px-4"} pt-4 ${
            hasBodyContent ? "pb-2.5" : "pb-5"
          } flex flex-col gap-1.5`}
        >
          {kicker && (
            <div className="text-[10.5px] font-extrabold text-sb-olive-light tracking-wider uppercase">
              {kicker}
            </div>
          )}
          {renderTitle()}
        </div>
      )}

      {hasBodyContent && (
        <div className="px-4 pb-4">
          {bodySlot ? bodySlot : (
            <p className="text-[13.5px] text-sb-ink-2 leading-relaxed whitespace-pre-wrap">
              {card.body}
            </p>
          )}
        </div>
      )}
    </article>
  );
}
