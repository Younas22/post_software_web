import type { Metadata, Viewport } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { Providers } from "./providers";

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
  display: "swap",
});

export const metadata: Metadata = {
  title: {
    default: "POS",
    template: "%s · POS",
  },
  description: "Universal POS — sell, manage inventory, and run your business from one app.",
  manifest: "/manifest.webmanifest",
  icons: {
    icon: "/icon.svg",
    apple: "/icon-192.png",
  },
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "POS",
  },
};

export const viewport: Viewport = {
  themeColor: "#00bf63",
  width: "device-width",
  initialScale: 1,
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="en" suppressHydrationWarning className={`${inter.variable} h-full antialiased`}>
      {/*
        suppressHydrationWarning here (as on <html> above, for next-themes'
        data-theme attribute) only silences a mismatch on THIS element's own
        attributes — it does not suppress warnings from anything rendered
        inside it. Added because a browser extension (password manager,
        Grammarly, an ad-blocker/dark-mode extension, etc.) commonly injects
        attributes into <body> before React hydrates, which is the exact
        generic warning Next.js's own docs name as a known false-positive
        cause. Every route was re-tested in a clean, extension-free browser
        and showed zero hydration mismatches, so this is a guard against
        extension noise, not a fix for a real bug.
      */}
      <body className="min-h-full bg-background text-foreground" suppressHydrationWarning>
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
