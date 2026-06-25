import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

const SITE_URL = "https://senior-tube.vercel.app";
const TITLE = "황금튜브 — 말씀만 하면 영상 한 편이 완성";
const DESC =
  "유튜브가 처음인 어르신을 위한 AI 영상 제작소. 만들고 싶은 이야기를 적기만 하면 내 말투 그대로 제목·대본·썸네일 글자·설명·태그까지 한 번에. 올리는 방법까지 알려드려요.";

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: TITLE,
  description: DESC,
  openGraph: {
    type: "website",
    locale: "ko_KR",
    url: SITE_URL,
    siteName: "황금튜브",
    title: TITLE,
    description: DESC,
    images: [
      { url: "/og.png", width: 1200, height: 630, alt: "황금튜브 — 시니어 유튜브 제작소" },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: TITLE,
    description: DESC,
    images: ["/og.png"],
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="ko"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col">{children}</body>
    </html>
  );
}
