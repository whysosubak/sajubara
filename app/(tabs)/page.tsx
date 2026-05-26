import AuthButton from "@/app/components/AuthButton";
import MenuCardLink from "@/app/components/MenuCardLink";
import { todayLunarLabel } from "@/lib/saju/today";
import Link from "next/link";

const BARA_FACE_SRC = "/images/brand/capybara-glass-face.png";

export default function Home() {
  const lunarLabel = todayLunarLabel();
  const dateLabel = formatKstDate();
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

function formatKstDate() {
  const now = new Date();
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

function OnsenHero({ lunarLabel, dateLabel }: { lunarLabel: string; dateLabel: string }) {
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
              {dateLabel}
            </div>
            <div className="mt-1 text-[11px] font-extrabold text-sb-ink-2 opacity-75">
              {lunarLabel}
            </div>
          </div>
        </div>

        <div className="relative z-20 px-5 pt-[112px]">
          <div className="text-[13px] font-extrabold text-sb-olive-dark leading-none mb-3">
            오늘 무료
          </div>
          <h1 className="text-[34px] font-extrabold text-sb-ink leading-[1.14]">
            오늘의 사주를
            <br />
            열어볼까요?
          </h1>
          <p className="mt-4 max-w-[250px] text-[13px] font-semibold text-sb-ink-2 leading-relaxed">
            오늘 하루의 점수와 조심할 순간을 먼저 확인해보세요.
          </p>
          <Link
            href="/today"
            className="mt-5 inline-flex h-10 items-center rounded-full bg-sb-paper px-4 text-[13px] font-extrabold text-sb-ink active:scale-[0.98] transition-transform"
            style={{
              boxShadow: "0 8px 18px rgba(91,74,54,0.14), inset 0 0 0 1px rgba(91,74,54,0.08)",
            }}
          >
            자세히 보기
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
          <span className="text-[19px] font-bold text-sb-olive-dark">사주바라</span>
          <span className="text-[10px] font-semibold text-sb-ink-3 mt-[3px]">
            따뜻하지만 정확한 운세 리포트
          </span>
        </div>
      </div>
      <AuthButton />
    </header>
  );
}

type MenuItem = {
  href: string;
  fallbackHref?: string;
  title: string;
  subtitle: string;
  description: string;
  image: string;
  badge?: string;
  fallbackFrom: string;
  fallbackTo: string;
  priceLabel: string;
  isFree: boolean;
  requiresSaju?: boolean;
};

const MENU: MenuItem[] = [
  {
    href: "/saju/result",
    fallbackHref: "/saju",
    title: "사주바라",
    subtitle: "기본 리포트",
    description: "타고난 성향과 관계의 결",
    image: "/images/banners/saju.png",
    fallbackFrom: "#FCE7E3",
    fallbackTo: "#F5C8C0",
    priceLabel: "일부 무료",
    isFree: true,
    requiresSaju: true,
  },
  {
    href: "/color",
    title: "컬러바라",
    subtitle: "무료 리포트",
    description: "음력 생일로 보는 운명 컬러",
    image: "/images/banners/color.png",
    badge: "무료",
    fallbackFrom: "#EDEAC8",
    fallbackTo: "#C9DFE5",
    priceLabel: "무료",
    isFree: true,
  },
  {
    href: "/daewoon",
    fallbackHref: "/saju?next=daewoon",
    title: "대운해설",
    subtitle: "10년 흐름",
    description: "지금 들어온 큰 흐름",
    image: "/images/banners/daewoon-blue.png",
    fallbackFrom: "#D9E9F7",
    fallbackTo: "#7EA8CF",
    priceLabel: "일부 무료",
    isFree: true,
    requiresSaju: true,
  },
  {
    href: "/yearly",
    fallbackHref: "/saju?next=yearly",
    title: "연도별운세",
    subtitle: "한 해 흐름",
    description: "월별 흐름과 조심할 때",
    image: "/images/banners/yearly.png",
    fallbackFrom: "#F5E5B6",
    fallbackTo: "#E8CB7B",
    priceLabel: "일부 무료",
    isFree: true,
    requiresSaju: true,
  },
];

function MenuGrid() {
  return (
    <section className="px-4 pt-2 pb-4">
      <div className="text-[10.5px] font-extrabold text-sb-ink-3 tracking-[0.18em] uppercase mb-1">
        Fortune Reports
      </div>
      <h2 className="text-[20px] font-extrabold text-sb-ink leading-tight mb-3.5">
        지금 필요한 흐름을 골라보세요
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
        {item.badge && (
          <span
            className="absolute top-2 right-2 inline-flex items-center px-2 py-[3px] rounded-full text-[10px] font-extrabold text-sb-ink"
            style={{
              background: "rgba(255, 253, 245, 0.78)",
              backdropFilter: "blur(6px)",
              boxShadow: "0 1px 3px rgba(0,0,0,0.12)",
            }}
          >
            {item.badge}
          </span>
        )}
      </div>

      <div className="px-3 pt-2.5 pb-3 flex flex-col min-h-[112px]">
        <div className="text-[10px] font-extrabold text-sb-ink-3 mb-1">
          {item.subtitle}
        </div>
        <h3 className="text-[16px] font-extrabold text-sb-ink leading-tight">
          {item.title}
        </h3>
        <p className="mt-1 text-[11px] font-semibold text-sb-ink-2 leading-snug min-h-[30px]">
          {item.description}
        </p>
        <div className="flex items-center justify-between mt-auto pt-2">
          {item.isFree ? (
            <span
              className="inline-flex items-center px-2 py-[3px] rounded-[6px] text-[10px] font-extrabold text-sb-olive-dark"
              style={{ background: "rgba(92,110,62,0.12)" }}
            >
              {item.priceLabel}
            </span>
          ) : (
            <span className="inline-flex items-center gap-1 text-[12px] font-extrabold text-sb-ink">
              <YuzuCoin />
              {item.priceLabel}
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
        사주바라 · 온천처럼 따뜻한 운세 리포트
      </p>
      <p className="text-[10.5px] font-semibold text-sb-ink-3 leading-relaxed opacity-80">
        사주·운세·컬러수비학 결과는 참고용 콘텐츠이며, 전문적인 의학·법률·재무·투자 판단을 대체하지 않습니다.
      </p>
      <div className="flex items-center justify-center gap-3 text-[10.5px] font-extrabold text-sb-ink-3">
        <Link href="/terms" className="underline underline-offset-2">
          이용약관
        </Link>
        <Link href="/privacy" className="underline underline-offset-2">
          개인정보처리방침
        </Link>
        <Link href="/refund" className="underline underline-offset-2">
          환불정책
        </Link>
      </div>
      <p className="text-[10px] text-sb-ink-3 opacity-60">
        © {new Date().getFullYear()} sajubara
      </p>
    </footer>
  );
}
