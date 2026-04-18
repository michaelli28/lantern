import type { Metadata } from "next";
import {
  EB_Garamond,
  Young_Serif,
  Special_Elite,
  Geist_Mono,
} from "next/font/google";
import "./globals.css";

const body = EB_Garamond({
  variable: "--ff-body",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  style: ["normal", "italic"],
  display: "swap",
});

const editorial = Young_Serif({
  variable: "--ff-editorial",
  subsets: ["latin"],
  weight: ["400"],
  display: "swap",
});

const typewriter = Special_Elite({
  variable: "--ff-typewriter",
  subsets: ["latin"],
  weight: ["400"],
  display: "swap",
});

const mono = Geist_Mono({
  variable: "--ff-mono",
  subsets: ["latin"],
  display: "swap",
});

export const metadata: Metadata = {
  title: "Lantern — before the last voice goes quiet",
  description:
    "Four Claude agents turn a WW2 veteran's YouTube testimony into an illustrated letter to their future descendants.",
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html
      lang="en"
      className={`${body.variable} ${editorial.variable} ${typewriter.variable} ${mono.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col bg-[var(--bg-page)] text-[var(--text-primary)]">
        {children}
      </body>
    </html>
  );
}
