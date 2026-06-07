import AuthButton from "@/app/components/AuthButton";
import { LocalizedValue, T } from "@/app/components/LanguageProvider";
import LanguageSwitcher from "@/app/components/LanguageSwitcher";
import MenuCardLink from "@/app/components/MenuCardLink";
import type { TranslationKey } from "@/app/i18n";
import { todayLunarLabel } from "@/lib/saju/today";
import Link from "next/link";

const BARA_FACE_SRC = "/images/brand/capybara-glass-face.png";
type LocalizedLabels = { ko: string; en: string };

export default function Home() {
  const lunarLabel = {
    ko: todayLunarLabel("ko"),
    en: todayLunarLabel("en"),
  };
  const dateLabel = {
    ko: formatKstDate("ko"),
    en: formatKstDate("en"),
  };
  return (
    <>
      <Header />
      <div className="flex-1 overflow-y-auto">
        <OnsenHero lunarLabel={lunarLabel} dateLabel={dateLabel} />
        <MenuGrid />
        <FooterMini />
      </div>
    </>
  );
}

function formatKstDate(locale: "ko" | "en") {
  const now = new Date();
  if (locale === "en") {
    return new Intl.DateTimeFormat("en-US", {
      timeZone: "Asia/Seoul",
      month: "short",
      day: "numeric",
      weekday: "short",
    }).format(now);
  }

  const parts = new Intl.DateTimeFormat("ko-KR", {
    timeZone: "Asia/Seoul",
    month: "numeric",
    day: "numeric",
    weekday: "short",
  }).formatToParts(now);
  const month = parts.find((p) => p.type === "month")?.value ?? "";
  const day = parts.find((p) => p.type === "day")?.value ?? "";
  const weekday = parts.find((p) => p.type === "weekday")?.value ?? "";
  return `${month}/${day} ${weekday}`;
}

function OnsenHero({
  lunarLabel,
  dateLabel,
}: {
  lunarLabel: LocalizedLabels;
  dateLabel: LocalizedLabels;
}) {
  return (
    <section className="px-4 pt-3 pb-2">
      <div
        className="relative min-h-[456px] rounded-sb-xl overflow-hidden"
        style={{
          background: "#F8EBD4",
          boxShadow: "var(--shadow-sb-hero), inset 0 1px 0 rgba(255,255,255,0.5)",
        }}
      >
        <img
          src="/images/hero/capybara-yuzu-onsen-ai.png?v=2"
          alt=""
          className="absolute inset-0 z-0 h-full w-full object-cover pointer-events-none select-none"
          aria-hidden
        />
        <div
          className="absolute inset-0 z-10 pointer-events-none"
          style={{
            background:
              "linear-gradient(180deg, rgba(255,253,245,0.18) 0%, rgba(255,253,245,0.08) 48%, rgba(255,248,232,0.18) 100%)",
          }}
        />
        <div className="absolute left-5 right-5 top-5 z-20">
          <div>
            <div className="text-[21px] font-extrabold text-sb-ink">
              <LocalizedValue ko={dateLabel.ko} en={dateLabel.en} />
            </div>
            <div className="mt-1 text-[11px] font-extrabold text-sb-ink-2 opacity-75">
              <LocalizedValue ko={lunarLabel.ko} en={lunarLabel.en} />
            </div>
          </div>
        </div>

        <div className="relative z-20 px-5 pt-[112px]">
          <div className="text-[13px] font-extrabold text-sb-olive-dark leading-none mb-3">
            <T k="home.hero.badge" />
          </div>
          <h1 className="text-[34px] font-extrabold text-sb-ink leading-[1.14]">
            <T k="home.hero.title" preserveLines />
          </h1>
          <p className="mt-4 max-w-[250px] text-[13px] font-semibold text-sb-ink-2 leading-relaxed">
            <T k="home.hero.description" />
          </p>
          <Link
            href="/today"
            className="mt-5 inline-flex h-10 items-center rounded-full bg-sb-paper px-4 text-[13px] font-extrabold text-sb-ink active:scale-[0.98] transition-transform"
            style={{
              boxShadow: "0 8px 18px rgba(91,74,54,0.14), inset 0 0 0 1px rgba(91,74,54,0.08)",
            }}
          >
            <T k="common.more" />
            <span className="ml-1.5" aria-hidden>
              →
            </span>
          </Link>
        </div>
      </div>
    </section>
  );
}

function Header() {
  return (
    <header
      className="flex items-center justify-between px-5 pt-3 pb-3 shrink-0"
      style={{
        background: "rgba(255, 248, 232, 0.88)",
        backdropFilter: "blur(20px) saturate(180%)",
        WebkitBackdropFilter: "blur(20px) saturate(180%)",
        borderBottom: "1px solid var(--sb-hairline)",
      }}
    >
      <div className="flex items-center gap-2">
        <div
          className="w-9 h-9 rounded-sb-md flex items-center justify-center overflow-hidden"
          style={{
            background: "rgba(255,253,245,0.74)",
            boxShadow:
              "0 2px 8px rgba(92,110,62,0.14), inset 0 0 0 1px rgba(92,110,62,0.13)",
          }}
        >
          <img
            src={BARA_FACE_SRC}
            alt=""
            className="h-8 w-8 object-cover"
            aria-hidden
          />
        </div>
        <div className="flex flex-col leading-none">
          <span className="text-[19px] font-bold text-sb-olive-dark">
            <T k="home.brand" />
          </span>
          <span className="text-[10px] font-semibold text-sb-ink-3 mt-[3px]">
            <T k="home.tagline" />
          </span>
        </div>
      </div>
      <div className="flex items-center gap-2">
        <LanguageSwitcher compact />
        <AuthButton />
      </div>
    </header>
  );
}

type MenuItem = {
  href: string;
  fallbackHref?: string;
  titleKey: TranslationKey;
  subtitleKey: TranslationKey;
  descriptionKey: TranslationKey;
  image: string;
  badgeKey?: TranslationKey;
  fallbackFrom: string;
  fallbackTo: string;
  priceLabelKey: TranslationKey;
  isFree: boolean;
  requiresSaju?: boolean;
};

const MENU: MenuItem[] = [
  {
    href: "/saju/result",
    fallbackHref: "/saju",
    titleKey: "home.menu.saju.title",
    subtitleKey: "home.menu.saju.subtitle",
    descriptionKey: "home.menu.saju.description",
    image: "/images/banners/saju.png",
    fallbackFrom: "#FCE7E3",
    fallbackTo: "#F5C8C0",
    priceLabelKey: "common.partlyFree",
    isFree: true,
    requiresSaju: true,
  },
  {
    href: "/color",
    titleKey: "home.menu.color.title",
    subtitleKey: "home.menu.color.subtitle",
    descriptionKey: "home.menu.color.description",
    image: "/images/banners/color.png",
    badgeKey: "common.free",
    fallbackFrom: "#EDEAC8",
    fallbackTo: "#C9DFE5",
    priceLabelKey: "common.free",
    isFree: true,
  },
  {
    href: "/daewoon",
    fallbackHref: "/saju?next=daewoon",
    titleKey: "home.menu.daewoon.title",
    subtitleKey: "home.menu.daewoon.subtitle",
    descriptionKey: "home.menu.daewoon.description",
    image: "/images/banners/daewoon-blue.png",
    fallbackFrom: "#D9E9F7",
    fallbackTo: "#7EA8CF",
    priceLabelKey: "common.partlyFree",
    isFree: true,
    requiresSaju: true,
  },
  {
    href: "/yearly",
    fallbackHref: "/saju?next=yearly",
    titleKey: "home.menu.yearly.title",
    subtitleKey: "home.menu.yearly.subtitle",
    descriptionKey: "home.menu.yearly.description",
    image: "/images/banners/yearly.png",
    fallbackFrom: "#F5E5B6",
    fallbackTo: "#E8CB7B",
    priceLabelKey: "common.partlyFree",
    isFree: true,
    requiresSaju: true,
  },
];

function MenuGrid() {
  return (
    <section className="px-4 pt-2 pb-4">
      <div className="text-[10.5px] font-extrabold text-sb-ink-3 tracking-[0.18em] uppercase mb-1">
        <T k="home.menu.eyebrow" />
      </div>
      <h2 className="text-[20px] font-extrabold text-sb-ink leading-tight mb-3.5">
        <T k="home.menu.title" />
      </h2>
      <div className="grid grid-cols-2 gap-3">
        {MENU.map((item) => (
          <MenuCard key={item.href} item={item} />
        ))}
      </div>
    </section>
  );
}

function MenuCard({ item }: { item: MenuItem }) {
  return (
    <MenuCardLink
      baseHref={item.href}
      requiresSaju={item.requiresSaju}
      fallbackHref={item.fallbackHref}
      className="block rounded-sb-lg overflow-hidden bg-sb-paper active:scale-[0.98] transition-transform"
      style={{ boxShadow: "var(--shadow-sb-card), inset 0 0 0 1px rgba(91,74,54,0.08)" }}
    >
      <div
        className="relative w-full aspect-[5/4] overflow-hidden"
        style={{
          backgroundImage: item.image
            ? `linear-gradient(180deg, rgba(42,31,20,0) 45%, rgba(42,31,20,0.45) 100%), url(${item.image}), linear-gradient(160deg, ${item.fallbackFrom} 0%, ${item.fallbackTo} 100%)`
            : `radial-gradient(circle at 28% 30%, rgba(143,191,122,0.78) 0 18%, transparent 19%), radial-gradient(circle at 68% 34%, rgba(229,200,77,0.74) 0 17%, transparent 18%), radial-gradient(circle at 54% 72%, rgba(109,145,198,0.72) 0 21%, transparent 22%), linear-gradient(160deg, ${item.fallbackFrom} 0%, ${item.fallbackTo} 100%)`,
          backgroundSize: item.image ? "cover, cover, cover" : "cover",
          backgroundPosition: "center, center",
          backgroundRepeat: "no-repeat, no-repeat, no-repeat",
        }}
        aria-hidden
      >
        {item.badgeKey && (
          <span
            className="absolute top-2 right-2 inline-flex items-center px-2 py-[3px] rounded-full text-[10px] font-extrabold text-sb-ink"
            style={{
              background: "rgba(255, 253, 245, 0.78)",
              backdropFilter: "blur(6px)",
              boxShadow: "0 1px 3px rgba(0,0,0,0.12)",
            }}
          >
            <T k={item.badgeKey} />
          </span>
        )}
      </div>

      <div className="px-3 pt-2.5 pb-3 flex flex-col min-h-[112px]">
        <div className="text-[10px] font-extrabold text-sb-ink-3 mb-1">
          <T k={item.subtitleKey} />
        </div>
        <h3 className="text-[16px] font-extrabold text-sb-ink leading-tight">
          <T k={item.titleKey} />
        </h3>
        <p className="mt-1 text-[11px] font-semibold text-sb-ink-2 leading-snug min-h-[30px]">
          <T k={item.descriptionKey} />
        </p>
        <div className="flex items-center justify-between mt-auto pt-2">
          {item.isFree ? (
            <span
              className="inline-flex items-center px-2 py-[3px] rounded-[6px] text-[10px] font-extrabold text-sb-olive-dark"
              style={{ background: "rgba(92,110,62,0.12)" }}
            >
              <T k={item.priceLabelKey} />
            </span>
          ) : (
            <span className="inline-flex items-center gap-1 text-[12px] font-extrabold text-sb-ink">
              <YuzuCoin />
              <T k={item.priceLabelKey} />
            </span>
          )}
          <span
            className="w-7 h-7 rounded-full flex items-center justify-center shrink-0"
            style={{ background: "var(--sb-ink)" }}
            aria-hidden
          >
            <svg width="10" height="10" viewBox="0 0 10 10" fill="none">
              <path
                d="M3.5 2L6.5 5L3.5 8"
                stroke="white"
                strokeWidth="1.8"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          </span>
        </div>
      </div>
    </MenuCardLink>
  );
}

function YuzuCoin() {
  return (
    <span
      className="inline-block w-3.5 h-3.5 rounded-full"
      style={{
        background:
          "radial-gradient(circle at 35% 30%, var(--sb-yuzu-light), var(--sb-yuzu) 65%, var(--sb-yuzu-dark))",
        boxShadow: "inset 0 -1px 1px rgba(139,94,60,0.25), 0 1px 2px rgba(216,154,42,0.35)",
      }}
      aria-hidden
    />
  );
}

function FooterMini() {
  return (
    <footer className="px-5 pt-3 pb-6 flex flex-col gap-2 text-center">
      <p className="text-[11px] font-semibold text-sb-ink-3 leading-relaxed">
        <T k="home.footer.brand" />
      </p>
      <p className="text-[10.5px] font-semibold text-sb-ink-3 leading-relaxed opacity-80">
        <T k="home.footer.disclaimer" />
      </p>
      <div className="flex items-center justify-center gap-3 text-[10.5px] font-extrabold text-sb-ink-3">
        <Link href="/terms" className="underline underline-offset-2">
          <T k="common.terms" />
        </Link>
        <Link href="/privacy" className="underline underline-offset-2">
          <T k="common.privacy" />
        </Link>
        <Link href="/refund" className="underline underline-offset-2">
          <T k="common.refund" />
        </Link>
      </div>
      <p className="text-[10px] text-sb-ink-3 opacity-60">
        © {new Date().getFullYear()} barasaju
      </p>
    </footer>
  );
}
