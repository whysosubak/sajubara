import type { Metadata } from "next";
import CodexBrowserOverlayFix from "./components/CodexBrowserOverlayFix";
import "./globals.css";

export const metadata: Metadata = {
  title: "사주바라 — 바라가 봐주면 다 맞아~",
  description: "카피바라가 유자탕에서 봐주는 따끈한 사주",
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
          href="https://fonts.googleapis.com/css2?family=Gowun+Dodum&family=Noto+Sans+KR:wght@400;500;700;800;900&display=swap"
          rel="stylesheet"
        />
      </head>
      <body className="h-dvh overflow-hidden">
        <CodexBrowserOverlayFix />
        {children}
      </body>
    </html>
  );
}
