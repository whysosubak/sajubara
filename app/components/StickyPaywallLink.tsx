"use client";

import Link from "next/link";
import { useEffect, useState } from "react";

type StickyPaywallLinkProps = {
  href: string;
  label: string;
  observeTargetId: string;
};

export default function StickyPaywallLink({
  href,
  label,
  observeTargetId,
}: StickyPaywallLinkProps) {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    let frame = 0;
    let detach: (() => void) | null = null;

    const bindTarget = () => {
      const target = document.getElementById(observeTargetId);
      if (!target || detach) return false;

      const update = () => {
        cancelAnimationFrame(frame);
        frame = requestAnimationFrame(() => {
          const rect = target.getBoundingClientRect();
          setVisible(rect.bottom < 96);
        });
      };

      const scrollRoot = target.closest(".overflow-y-auto");
      update();
      scrollRoot?.addEventListener("scroll", update, { passive: true });
      window.addEventListener("resize", update);
      detach = () => {
        scrollRoot?.removeEventListener("scroll", update);
        window.removeEventListener("resize", update);
      };
      return true;
    };

    if (bindTarget()) {
      return () => {
        cancelAnimationFrame(frame);
        detach?.();
      };
    }

    /* eslint-disable react-hooks/set-state-in-effect */
    setVisible(false);
    /* eslint-enable react-hooks/set-state-in-effect */
    const observer = new MutationObserver(() => {
      if (bindTarget()) observer.disconnect();
    });
    observer.observe(document.body, { childList: true, subtree: true });

    const retry = window.setInterval(() => {
      if (bindTarget()) {
        observer.disconnect();
        window.clearInterval(retry);
      }
    }, 250);

    return () => {
      cancelAnimationFrame(frame);
      observer.disconnect();
      window.clearInterval(retry);
      detach?.();
    };
  }, [observeTargetId]);

  return (
    <div
      className={`fixed z-30 px-3 pb-3 pointer-events-none transition-all duration-200 ${
        visible
          ? "translate-y-0 opacity-100"
          : "translate-y-3 opacity-0"
      }`}
      style={{
        bottom: 128,
        left: "max(0px, calc((100vw - 420px) / 2))",
        right: "max(0px, calc((100vw - 420px) / 2))",
      }}
      aria-hidden={!visible}
    >
      <Link
        href={href}
        className="pointer-events-auto flex min-h-12 min-w-0 items-center justify-center gap-2 rounded-full px-4 py-3 text-center text-[13.5px] font-extrabold leading-snug tracking-tight"
        style={{
          background:
            "linear-gradient(135deg, var(--sb-yuzu-light), var(--sb-yuzu) 60%, var(--sb-yuzu-dark))",
          color: "var(--sb-olive-dark)",
          boxShadow: "0 8px 22px rgba(216,154,42,0.55)",
        }}
      >
        <span className="min-w-0 break-keep">{label}</span>
        <svg
          width="11"
          height="11"
          viewBox="0 0 10 10"
          fill="none"
          className="shrink-0"
          aria-hidden
        >
          <path
            d="M3.5 2L6.5 5L3.5 8"
            stroke="var(--sb-olive-dark)"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      </Link>
    </div>
  );
}
