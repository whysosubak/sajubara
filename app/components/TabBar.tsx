"use client";

import {
  IconArchive,
  IconArchiveFilled,
  IconCoin,
  IconCoinFilled,
  IconHome,
  IconHomeFilled,
  IconUserFilled,
  IconUserPlus,
} from "@tabler/icons-react";
import Link from "next/link";
import { usePathname } from "next/navigation";

const BARA_FACE_SRC = "/images/brand/capybara-glass-face.png";

type Tab = {
  href: string;
  label: string;
  iconKey: "home" | "people" | "charge" | "archive";
};

const LEFT_TABS: Tab[] = [
  { href: "/", label: "홈", iconKey: "home" },
  { href: "/people", label: "사주 관리", iconKey: "people" },
];

const RIGHT_TABS: Tab[] = [
  { href: "/charge", label: "충전소", iconKey: "charge" },
  { href: "/my", label: "보관함", iconKey: "archive" },
];

const TAB_ICONS = {
  home: { line: IconHome, active: IconHomeFilled },
  people: { line: IconUserPlus, active: IconUserFilled },
  charge: { line: IconCoin, active: IconCoinFilled },
  archive: { line: IconArchive, active: IconArchiveFilled },
} satisfies Record<
  Tab["iconKey"],
  {
    line: typeof IconHome;
    active: typeof IconHome;
  }
>;

export default function TabBar() {
  const pathname = usePathname();
  const isActive = (href: string) =>
    href === "/" ? pathname === "/" : pathname === href || pathname.startsWith(`${href}/`);

  return (
    <nav
      aria-label="하단 탭"
      className="pointer-events-none fixed bottom-0 left-1/2 z-40 w-full max-w-[420px] -translate-x-1/2 px-3 pt-5 pb-[calc(0.7rem+env(safe-area-inset-bottom))]"
    >
      <div
        className="pointer-events-auto relative flex items-end rounded-[28px] px-1.5 pt-1.5 pb-2"
        style={{
          background: "linear-gradient(135deg, rgba(255,253,245,0.58), rgba(255,255,255,0.34))",
          backdropFilter: "blur(24px) saturate(185%)",
          WebkitBackdropFilter: "blur(24px) saturate(185%)",
          border: "1px solid rgba(255,255,255,0.68)",
          boxShadow:
            "0 16px 36px rgba(91,74,54,0.18), inset 0 1px 0 rgba(255,255,255,0.78)",
        }}
      >
        {LEFT_TABS.map((tab) => (
          <TabItem key={tab.href} tab={tab} active={isActive(tab.href)} />
        ))}
        <CenterTab active={isActive("/today")} />
        {RIGHT_TABS.map((tab) => (
          <TabItem key={tab.href} tab={tab} active={isActive(tab.href)} />
        ))}
      </div>
    </nav>
  );
}

function TabItem({ tab, active }: { tab: Tab; active: boolean }) {
  const color = active ? "text-sb-olive" : "text-sb-ink-3";
  return (
    <Link
      href={tab.href}
      className={`flex-1 flex flex-col items-center gap-[3px] py-1.5 ${color}`}
      aria-current={active ? "page" : undefined}
    >
      <TabIcon iconKey={tab.iconKey} active={active} />
      <span
        className={`text-[10px] tracking-tight ${active ? "font-extrabold" : "font-semibold"}`}
      >
        {tab.label}
      </span>
    </Link>
  );
}

function CenterTab({ active }: { active: boolean }) {
  return (
    <div className="flex-1 flex flex-col items-center gap-[2px] relative">
      <Link
        href="/today"
        className="relative -mt-7 w-[58px] h-[58px] rounded-full flex items-center justify-center active:scale-95 transition-transform overflow-hidden"
        style={{
          background: "rgba(255,253,245,0.82)",
          border: active ? "1.5px solid var(--sb-olive)" : "1.5px solid rgba(92,110,62,0.18)",
          boxShadow: active
            ? "0 8px 22px rgba(92,110,62,0.25), inset 0 1px 0 rgba(255,255,255,0.72)"
            : "0 8px 22px rgba(92,110,62,0.18), inset 0 1px 0 rgba(255,255,255,0.68)",
        }}
        aria-label="오늘의 운세"
        aria-current={active ? "page" : undefined}
      >
        <img
          src={BARA_FACE_SRC}
          alt=""
          className="h-[56px] w-[56px] rounded-full object-cover scale-[1.16]"
          aria-hidden
        />
      </Link>
      <span className={`text-[10px] font-extrabold tracking-tight ${active ? "text-sb-olive" : "text-sb-ink-3"}`}>
        오늘의 운세
      </span>
    </div>
  );
}

function TabIcon({ iconKey, active }: { iconKey: Tab["iconKey"]; active: boolean }) {
  const IconComponent = active ? TAB_ICONS[iconKey].active : TAB_ICONS[iconKey].line;

  return (
    <span
      className="grid h-[25px] w-[25px] place-items-center rounded-full transition-colors"
      style={{
        background: active ? "rgba(92,110,62,0.1)" : "transparent",
        color: active ? "var(--sb-olive)" : "var(--sb-ink-3)",
      }}
    >
      <IconComponent
        size={22}
        stroke={active ? 2.3 : 1.9}
        aria-hidden
        className="shrink-0"
      />
    </span>
  );
}
