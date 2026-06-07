import type { Metadata } from "next";
import CodexBrowserOverlayFix from "./components/CodexBrowserOverlayFix";
import { LanguageProvider } from "./components/LanguageProvider";
import "./globals.css";

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? "https://www.barasaju.com";

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  applicationName: "바라사주",
  title: {
    default: "바라사주 — 바라가 봐주면 다 맞아~",
    template: "%s | 바라사주",
  },
  description: "카피바라가 유자탕에서 봐주는 따끈한 사주",
  alternates: {
    canonical: "/",
  },
  openGraph: {
    title: "바라사주 — 바라가 봐주면 다 맞아~",
    description: "사주, 오늘의 운세, 대운과 연도별 흐름을 따뜻하고 또렷하게 풀어주는 운세 리포트.",
    url: "/",
    siteName: "바라사주",
    locale: "ko_KR",
    type: "website",
    images: [
      {
        url: "/images/hero/capybara-yuzu-onsen-ai.png",
        width: 1200,
        height: 630,
        alt: "바라사주 온천 히어로 이미지",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "바라사주 — 바라가 봐주면 다 맞아~",
    description: "카피바라가 유자탕에서 봐주는 따끈한 사주",
    images: ["/images/hero/capybara-yuzu-onsen-ai.png"],
  },
  icons: {
    icon: "/images/brand/capybara-glass-face.png",
    apple: "/images/brand/capybara-glass-face.png",
  },
  category: "entertainment",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ko" className="antialiased">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="" />
        <link
          href="https://fonts.googleapis.com/css2?family=Cormorant+Garamond:wght@600;700&family=Gowun+Dodum&family=Noto+Sans+KR:wght@400;500;700;800;900&display=swap"
          rel="stylesheet"
        />
      </head>
      <body className="h-dvh overflow-hidden">
        <LanguageProvider>
          <CodexBrowserOverlayFix />
          {children}
        </LanguageProvider>
      </body>
    </html>
  );
}
