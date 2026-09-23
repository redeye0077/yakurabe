import type { Metadata } from "next";
import { Shippori_Mincho, Zen_Kaku_Gothic_New } from "next/font/google";
import "./globals.css";
import { Providers } from "./providers";

// 本文・UI用(ゴシック)。可変フォントではないため weight の指定が必須
const zenKakuGothicNew = Zen_Kaku_Gothic_New({
  variable: "--font-zen-kaku",
  weight: ["400", "500", "700"],
  subsets: ["latin"],
  display: "swap",
});

// 見出し用(明朝)
const shipporiMincho = Shippori_Mincho({
  variable: "--font-shippori",
  weight: ["500", "600"],
  subsets: ["latin"],
  display: "swap",
});

export const metadata: Metadata = {
  title: "矢比べ",
  description:
    "バレル・シャフト・フライトの組み合わせを記録し、他のプレイヤーと共有できるダーツセッティング共有アプリ",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="ja"
      className={`${zenKakuGothicNew.variable} ${shipporiMincho.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col">
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
