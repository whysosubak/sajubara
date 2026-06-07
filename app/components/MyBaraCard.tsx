"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { useI18n } from "@/app/components/LanguageProvider";
import { cardById, isCardWritten } from "@/lib/bara/cards";
import {
  BRANCH_LABEL_EN,
  BRANCH_LABEL_KR,
  ELEMENT_EMOJI,
  ELEMENT_LABEL_EN,
  ELEMENT_LABEL_KR,
} from "@/lib/bara/types";

const STORAGE_KEY = "barasaju:lastSajuCardId";

export default function MyBaraCard() {
  const { locale, t } = useI18n();
  const [cardId, setCardId] = useState<string | null>(null);
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    /* eslint-disable react-hooks/set-state-in-effect */
    setHydrated(true);
    try {
      setCardId(localStorage.getItem(STORAGE_KEY));
    } catch {
      // localStorage unavailable
    }
    /* eslint-enable react-hooks/set-state-in-effect */
  }, []);

  if (!hydrated) return null;

  if (!cardId) {
    return (
      <section className="px-4 pt-1 pb-4">
        <div
          className="bg-sb-paper rounded-sb-lg px-4 py-4"
          style={{
            boxShadow: "var(--shadow-sb-card), inset 0 0 0 1px rgba(91,74,54,0.06)",
          }}
        >
          <p className="text-[13px] text-sb-ink-2 leading-relaxed mb-3">
            {t("my.emptyBody")}
          </p>
          <Link
            href="/saju"
            className="inline-flex items-center gap-1.5 rounded-full bg-sb-olive text-white text-[12.5px] font-bold px-3.5 py-2"
            style={{ boxShadow: "0 2px 6px rgba(92,110,62,0.3)" }}
          >
            {t("my.emptyCta")}
            <svg width="10" height="10" viewBox="0 0 10 10" fill="none" aria-hidden>
              <path d="M3.5 2L6.5 5L3.5 8" stroke="white" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </Link>
        </div>
      </section>
    );
  }

  const card = cardById(cardId);
  if (!card) return null;
  const written = isCardWritten(card);
  const cardLabel = locale === "ko" && written
    ? card.nickname
    : locale === "ko"
      ? `${ELEMENT_LABEL_KR[card.element]} · ${BRANCH_LABEL_KR[card.branch]}`
      : `${ELEMENT_LABEL_EN[card.element]} · ${BRANCH_LABEL_EN[card.branch]}`;

  return (
    <section className="px-4 pt-1 pb-4">
      <Link
        href="/my"
        className="block bg-sb-paper rounded-sb-lg px-4 py-4 active:scale-[0.99] transition-transform"
        style={{ boxShadow: "var(--shadow-sb-card), inset 0 0 0 1px rgba(91,74,54,0.06)" }}
      >
        <div className="flex items-center gap-3">
          <div
            className="w-12 h-12 rounded-sb-md flex items-center justify-center text-[24px] shrink-0"
            style={{ background: "var(--sb-cream)" }}
            aria-hidden
          >
            {ELEMENT_EMOJI[card.element]}
          </div>
          <div className="flex-1 min-w-0">
            <div className="text-[10.5px] font-extrabold text-sb-olive-light tracking-wider uppercase mb-0.5">
              {locale === "ko" ? "내 바라 카드" : "My Bara Card"}
            </div>
            <h3 className="text-[15px] font-extrabold text-sb-ink leading-tight tracking-tight">
              {cardLabel}
            </h3>
          </div>
          <span className="text-[12px] font-semibold text-sb-ink-3 shrink-0">
            {locale === "ko" ? "결과 다시 보기 ›" : "View result again ›"}
          </span>
        </div>
      </Link>
    </section>
  );
}
