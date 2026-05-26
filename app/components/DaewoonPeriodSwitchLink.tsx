"use client";

import type { CSSProperties, ReactNode } from "react";
import { useState } from "react";
import { useRouter } from "next/navigation";

type DaewoonPeriodSwitchLinkProps = {
  href: string;
  periodLabel: string;
  alreadyUnlocked?: boolean;
  className?: string;
  style?: CSSProperties;
  children: ReactNode;
};

export default function DaewoonPeriodSwitchLink({
  href,
  periodLabel,
  alreadyUnlocked = false,
  className,
  style,
  children,
}: DaewoonPeriodSwitchLinkProps) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [navigating, setNavigating] = useState(false);

  const move = () => {
    setNavigating(true);
    router.push(href);
  };

  return (
    <>
      <button
        type="button"
        className={className}
        style={style}
        onClick={() => setOpen(true)}
      >
        {children}
      </button>

      {open && (
        <div
          className="fixed inset-0 z-50 flex items-end justify-center px-4 pb-5"
          style={{ background: "rgba(61,46,32,0.38)" }}
          role="dialog"
          aria-modal="true"
          aria-label="대운 해설 이동 확인"
        >
          <button
            type="button"
            className="absolute inset-0 cursor-default"
            aria-label="닫기"
            onClick={() => setOpen(false)}
          />
          <div
            className="relative w-full max-w-[390px] rounded-sb-xl bg-sb-paper px-5 pt-5 pb-4"
            style={{ boxShadow: "0 20px 50px rgba(61,46,32,0.24)" }}
          >
            <div className="text-[11px] font-extrabold text-sb-terra-dark tracking-wider uppercase mb-2">
              {alreadyUnlocked ? "🔓 보관된 대운 해설" : "🌊 대운 해설 이동"}
            </div>
            <h2 className="text-[19px] font-extrabold text-sb-ink tracking-tight leading-snug mb-2">
              {alreadyUnlocked
                ? "이미 결제한 대운이에요"
                : "새로운 대운해설 창으로 넘어갑니다"}
            </h2>
            <p className="text-[13px] text-sb-ink-2 leading-relaxed mb-4">
              {alreadyUnlocked
                ? `${periodLabel} 대운은 이미 열려 있어요. 이전에 생성된 상세 해설로 바로 이동합니다.`
                : `지금 보던 해설을 벗어나 ${periodLabel} 대운 핵심 화면으로 이동합니다. 상세 본문은 해당 대운에서 990원으로 열 수 있어요.`}
            </p>
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                className="rounded-full bg-sb-cream px-4 py-3 text-[13px] font-extrabold text-sb-ink-2"
                onClick={() => setOpen(false)}
                disabled={navigating}
              >
                계속 보기
              </button>
              <button
                type="button"
                className="rounded-full px-4 py-3 text-[13px] font-extrabold"
                style={{
                  background:
                    "linear-gradient(135deg, var(--sb-yuzu-light), var(--sb-yuzu) 60%, var(--sb-yuzu-dark))",
                  color: "var(--sb-olive-dark)",
                  boxShadow: "0 4px 14px rgba(216,154,42,0.35)",
                }}
                onClick={move}
                disabled={navigating}
              >
                {navigating ? "이동 중..." : alreadyUnlocked ? "다시 보기" : "새 해설 보기"}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
