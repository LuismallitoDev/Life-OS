import type { Metadata } from "next";
import { Inter, Geist_Mono } from "next/font/google";
import "./globals.css";
import { SideNav } from "@/components/side-nav";

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700", "800"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
  weight: ["400", "500"],
});

export const metadata: Metadata = {
  title: "Life OS",
  description: "Personal dashboard for work, finance, goals, and health.",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="en"
      className={`${inter.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="min-h-full flex bg-[var(--bg)] text-[var(--text)]">
        <SideNav />
        <main className="relative z-[1] flex-1 min-w-0 overflow-y-auto">
          <div className="max-w-6xl mx-auto px-8 py-8">{children}</div>
        </main>
      </body>
    </html>
  );
}
