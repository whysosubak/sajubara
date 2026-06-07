"use client";

import {
  IconArchive,
  IconCalendarStats,
  IconChevronRight,
  IconFileText,
  IconMenu2,
  IconPalette,
  IconSparkles,
  IconSun,
  IconUsers,
  IconWallet,
  IconX,
} from "@tabler/icons-react";
import Link from "next/link";
import { useState, type ReactNode } from "react";
import { createPortal } from "react-dom";
import AuthButton from "@/app/components/AuthButton";
import BusinessInfoPanel from "@/app/components/BusinessInfoPanel";
import LanguageSwitcher from "@/app/components/LanguageSwitcher";
import { T } from "@/app/components/LanguageProvider";
import type { TranslationKey } from "@/app/i18n";

const reportLinks: DrawerLink[] = [
  {
    href: "/today",
    title: "오늘의 운세",
    description: "무료 데일리 흐름",
    icon: IconSun,
  },
  {
    href: "/saju",
    titleKey: "home.menu.saju.title",
    descriptionKey: "home.menu.saju.description",
    icon: IconSparkles,
  },
  {
    href: "/color",
    titleKey: "home.menu.color.title",
    descriptionKey: "home.menu.color.description",
    icon: IconPalette,
  },
  {
    href: "/daewoon",
    titleKey: "home.menu.daewoon.title",
    descriptionKey: "home.menu.daewoon.description",
    icon: IconCalendarStats,
  },
  {
    href: "/yearly",
    titleKey: "home.menu.yearly.title",
    descriptionKey: "home.menu.yearly.description",
    icon: IconFileText,
  },
];

const appLinks: DrawerLink[] = [
  {
    href: "/charge",
    title: "충전소",
    description: "유자 충전과 결제",
    icon: IconWallet,
  },
  {
    href: "/people",
    title: "사주 관리",
    description: "내 사주와 다른 사람",
    icon: IconUsers,
  },
  {
    href: "/my",
    title: "보관함",
    description: "구매한 리포트",
    icon: IconArchive,
  },
];

const policyLinks = [
  { href: "/terms", labelKey: "common.terms" as const },
  { href: "/privacy", labelKey: "common.privacy" as const },
  { href: "/refund", labelKey: "common.refund" as const },
];

type DrawerLink = {
  href: string;
  title?: string;
  titleKey?: TranslationKey;
  description?: string;
  descriptionKey?: TranslationKey;
  icon: typeof IconSparkles;
};

export default function HomeDrawerMenu() {
  const [open, setOpen] = useState(false);

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="flex h-10 w-10 items-center justify-center rounded-full bg-sb-paper text-sb-ink-2 active:scale-[0.97]"
        style={{ boxShadow: "inset 0 0 0 1px var(--sb-hairline)" }}
        aria-label="메뉴 열기"
        aria-expanded={open}
      >
        <IconMenu2 size={21} stroke={2.2} aria-hidden />
      </button>

      {open && typeof document !== "undefined"
        ? createPortal(<DrawerOverlay onClose={() => setOpen(false)} />, document.body)
        : null}
    </>
  );
}

function DrawerOverlay({ onClose }: { onClose: () => void }) {
  return (
    <div className="fixed inset-0 z-50 flex justify-end bg-[rgba(30,24,17,0.38)]">
      <button
        type="button"
        className="absolute inset-0 cursor-default"
        onClick={onClose}
        aria-label="메뉴 닫기"
      />
      <aside
        className="relative flex h-full w-[min(360px,calc(100vw-42px))] flex-col bg-sb-bg"
        style={{ boxShadow: "-18px 0 36px rgba(42,31,20,0.2)" }}
        aria-label="전체 메뉴"
      >
        <div
          className="shrink-0 px-5 pb-4 pt-4"
          style={{
            background: "rgba(255, 248, 232, 0.94)",
            borderBottom: "1px solid var(--sb-hairline)",
          }}
        >
          <div className="flex items-center justify-between gap-3">
            <div>
              <p className="text-[18px] font-extrabold leading-tight text-sb-olive-dark">
                <T k="home.brand" />
              </p>
              <p className="mt-1 text-[11px] font-semibold text-sb-ink-3">
                <T k="home.tagline" />
              </p>
            </div>
            <button
              type="button"
              onClick={onClose}
              className="flex h-9 w-9 items-center justify-center rounded-full bg-sb-paper text-sb-ink-2"
              style={{ boxShadow: "inset 0 0 0 1px var(--sb-hairline)" }}
              aria-label="메뉴 닫기"
            >
              <IconX size={19} stroke={2.2} aria-hidden />
            </button>
          </div>

          <div className="mt-4 flex items-center justify-between gap-3">
            <AuthButton />
            <LanguageSwitcher compact />
          </div>
        </div>

        <div className="min-h-0 flex-1 overflow-y-auto px-5 py-5">
          <DrawerSection title="운세 리포트">
            {reportLinks.map((item) => (
              <DrawerNavLink key={item.href} item={item} onClick={onClose} />
            ))}
          </DrawerSection>

          <DrawerSection title="내 메뉴">
            {appLinks.map((item) => (
              <DrawerNavLink key={item.href} item={item} onClick={onClose} />
            ))}
          </DrawerSection>

          <section className="mt-5">
            <p className="text-[11px] font-extrabold uppercase tracking-[0.14em] text-sb-ink-3">
              Policy
            </p>
            <div className="mt-2 flex flex-wrap gap-2">
              {policyLinks.map((item) => (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={onClose}
                  className="rounded-full bg-sb-paper px-3 py-2 text-[11px] font-extrabold text-sb-ink-2 underline-offset-2"
                  style={{ boxShadow: "inset 0 0 0 1px var(--sb-hairline)" }}
                >
                  <T k={item.labelKey} />
                </Link>
              ))}
            </div>
          </section>

          <section className="mt-5 text-[10.5px] font-semibold leading-relaxed text-sb-ink-3">
            <p>
              <T k="home.footer.brand" />
            </p>
            <p className="mt-1 opacity-80">
              <T k="home.footer.disclaimer" />
            </p>
          </section>

          <div className="mt-5">
            <BusinessInfoPanel compact />
          </div>

          <p className="pb-4 pt-5 text-[10px] font-semibold text-sb-ink-3 opacity-60">
            © {new Date().getFullYear()} barasaju
          </p>
        </div>
      </aside>
    </div>
  );
}

function DrawerSection({
  title,
  children,
}: {
  title: string;
  children: ReactNode;
}) {
  return (
    <section className="mt-1 first:mt-0">
      <p className="text-[11px] font-extrabold uppercase tracking-[0.14em] text-sb-ink-3">
        {title}
      </p>
      <div className="mt-2 flex flex-col gap-2">{children}</div>
    </section>
  );
}

function DrawerNavLink({
  item,
  onClick,
}: {
  item: DrawerLink;
  onClick: () => void;
}) {
  const Icon = item.icon;
  return (
    <Link
      href={item.href}
      onClick={onClick}
      className="grid grid-cols-[38px_1fr_auto] items-center gap-3 rounded-sb-md bg-sb-paper px-3 py-3 active:scale-[0.99]"
      style={{ boxShadow: "var(--shadow-sb-card), inset 0 0 0 1px rgba(91,74,54,0.06)" }}
    >
      <span
        className="flex h-[38px] w-[38px] items-center justify-center rounded-full text-sb-olive-dark"
        style={{ background: "rgba(92,110,62,0.12)" }}
        aria-hidden
      >
        <Icon size={19} stroke={2} />
      </span>
      <span className="min-w-0">
        <span className="block text-[14px] font-extrabold leading-tight text-sb-ink">
          {item.titleKey ? <T k={item.titleKey} /> : item.title}
        </span>
        <span className="mt-1 block text-[11px] font-semibold leading-snug text-sb-ink-3">
          {item.descriptionKey ? <T k={item.descriptionKey} /> : item.description}
        </span>
      </span>
      <IconChevronRight size={16} className="text-sb-ink-3" aria-hidden />
    </Link>
  );
}
