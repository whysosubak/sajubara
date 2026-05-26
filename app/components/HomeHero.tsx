"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useState } from "react";
import { LS_CARD_ID } from "./SaveLastSajuCard";
import { cardById, isCardWritten } from "@/lib/bara/cards";
import { dailyBaraCard } from "@/lib/bara/daily";
import {
  BRANCH_LABEL_KR,
  ELEMENT_EMOJI,
  ELEMENT_LABEL_KR,
  type BaraCard,
} from "@/lib/bara/types";

const BARA_FACE_SRC = "/images/brand/capybara-glass-face.png";

function HeroAvatar({ card }: { card: BaraCard }) {
  if (card.image) {
    return (
      <div
        className="shrink-0 w-16 h-16 rounded-full overflow-hidden relative"
        style={{
          boxShadow: "0 4px 14px rgba(0,0,0,0.15)",
          border: "2px solid rgba(255,255,255,0.9)",
        }}
      >
        <Image
          src={card.image}
          alt={card.nickname || card.id}
          fill
          sizes="64px"
          className="object-cover"
        />
      </div>
    );
  }
  return (
    <div
      className="shrink-0 w-14 h-14 rounded-full flex items-center justify-center overflow-hidden"
      style={{
        background: "rgba(255,253,245,0.72)",
        boxShadow:
          "0 5px 16px rgba(92,110,62,0.16), inset 0 0 0 1px rgba(255,255,255,0.72)",
      }}
    >
      <Image
        src={BARA_FACE_SRC}
        alt=""
        width={80}
        height={80}
        sizes="56px"
        className="h-[58px] w-[58px] object-cover scale-[1.08]"
        aria-hidden
      />
    </div>
  );
}

export default function HomeHero() {
  const [savedCardId, setSavedCardId] = useState<string | null>(null);
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    /* eslint-disable react-hooks/set-state-in-effect */
    setHydrated(true);
    try {
      setSavedCardId(localStorage.getItem(LS_CARD_ID));
    } catch {
      // ignore
    }
    /* eslint-enable react-hooks/set-state-in-effect */
  }, []);

  const sample = dailyBaraCard();
  const personal = hydrated && savedCardId ? cardById(savedCardId) : null;

  if (personal) {
    return <PersonalHero card={personal} />;
  }
  return <SampleHero card={sample} hydrated={hydrated} />;
}

function HeroShell({ children }: { children: React.ReactNode }) {
  return (
    <section className="px-4 pt-3 pb-4">
      <div
        className="relative rounded-sb-xl overflow-hidden px-5 pt-5 pb-5"
        style={{
          background: "linear-gradient(170deg, #F0E4C2 0%, #E4D5A8 55%, #C9B27A 100%)",
          boxShadow: "var(--shadow-sb-hero), inset 0 1px 0 rgba(255,255,255,0.5)",
        }}
      >
        <div
          className="absolute pointer-events-none"
          style={{
            top: -40,
            right: -40,
            width: 180,
            height: 180,
            borderRadius: "50%",
            background:
              "radial-gradient(circle, rgba(255,240,180,0.7) 0%, rgba(255,240,180,0) 70%)",
          }}
        />
        <div
          className="absolute inset-0 pointer-events-none"
          style={{
            opacity: 0.18,
            backgroundImage:
              "radial-gradient(circle at 20% 30%, #8B5E3C 0.5px, transparent 1px), radial-gradient(circle at 70% 60%, #8B5E3C 0.5px, transparent 1px)",
            backgroundSize: "14px 14px, 22px 22px",
          }}
        />
        {children}
      </div>
    </section>
  );
}

function SampleHero({ card, hydrated }: { card: BaraCard; hydrated: boolean }) {
  const written = isCardWritten(card);
  return (
    <HeroShell>
      <div className="relative flex items-start gap-3 mb-3">
        <HeroAvatar card={card} />
        <div className="pt-0.5">
          <div className="flex items-center gap-1.5 mb-1">
            <span className="text-[10.5px] font-extrabold text-sb-olive-dark tracking-wider uppercase">
              오늘의 샘플
            </span>
            <span
              className="text-[9px] font-extrabold px-1.5 py-[1px] rounded-full"
              style={{ background: "rgba(255,255,255,0.6)", color: "var(--sb-terra-dark)" }}
            >
              매일 새로 도착
            </span>
          </div>
          {written ? (
            <h2 className="text-[16px] font-extrabold text-sb-ink leading-snug tracking-tight">
              {card.nickname}
            </h2>
          ) : (
            <h2 className="text-[16px] font-extrabold text-sb-ink leading-snug tracking-tight">
              {ELEMENT_EMOJI[card.element]} {ELEMENT_LABEL_KR[card.element]}
              {BRANCH_LABEL_KR[card.branch]}의 하루
            </h2>
          )}
        </div>
      </div>
      <div className="relative">
        <p className="text-[12.5px] text-sb-ink-2 leading-relaxed mb-3 line-clamp-2">
          {written
            ? card.body
            : "이건 오늘 모두에게 도착한 샘플 카드예요. 내 사주를 등록하면 진짜 내 카드를 매일 받을 수 있어요."}
        </p>
        <Link
          href="/saju"
          className="inline-flex items-center gap-1 rounded-full px-3.5 py-1.5 text-[12px] font-extrabold"
          style={{
            background: "rgba(255,255,255,0.85)",
            color: "var(--sb-olive-dark)",
            boxShadow: "0 2px 6px rgba(0,0,0,0.1)",
            visibility: hydrated ? "visible" : "hidden",
          }}
        >
          내 카드 받으러 가기
          <svg width="10" height="10" viewBox="0 0 10 10" fill="none" aria-hidden>
            <path
              d="M3.5 2L6.5 5L3.5 8"
              stroke="var(--sb-olive-dark)"
              strokeWidth="1.8"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        </Link>
      </div>
    </HeroShell>
  );
}

function PersonalHero({ card }: { card: BaraCard }) {
  const written = isCardWritten(card);
  return (
    <HeroShell>
      <div className="relative flex items-start gap-3 mb-3">
        <HeroAvatar card={card} />
        <div className="pt-0.5">
          <div className="text-[10.5px] font-extrabold text-sb-olive-dark tracking-wider uppercase mb-1">
            오늘의 바라
          </div>
          {written ? (
            <h2 className="text-[16px] font-extrabold text-sb-ink leading-snug tracking-tight">
              {card.nickname}
            </h2>
          ) : (
            <h2 className="text-[16px] font-extrabold text-sb-ink leading-snug tracking-tight">
              {ELEMENT_EMOJI[card.element]} {ELEMENT_LABEL_KR[card.element]}
              {BRANCH_LABEL_KR[card.branch]}의 하루
            </h2>
          )}
        </div>
      </div>
      <div className="relative">
        <p className="text-[12.5px] text-sb-ink-2 leading-relaxed mb-3 line-clamp-2">
          {written
            ? card.body
            : "내 카드 본문은 곧 도착할 예정이에요."}
        </p>
        <Link
          href="/my"
          className="inline-flex items-center gap-1 rounded-full px-3.5 py-1.5 text-[12px] font-extrabold"
          style={{
            background: "rgba(255,255,255,0.85)",
            color: "var(--sb-olive-dark)",
            boxShadow: "0 2px 6px rgba(0,0,0,0.1)",
          }}
        >
          내 결과 다시 보기
          <svg width="10" height="10" viewBox="0 0 10 10" fill="none" aria-hidden>
            <path
              d="M3.5 2L6.5 5L3.5 8"
              stroke="var(--sb-olive-dark)"
              strokeWidth="1.8"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        </Link>
      </div>
    </HeroShell>
  );
}
