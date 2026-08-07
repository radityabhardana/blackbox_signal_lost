import type { Metadata, Viewport } from "next";
import type { ReactNode } from "react";
import Script from "next/script";
import { SkipLink } from "@/components/accessibility/skip-link";
import "./globals.css";

export const metadata: Metadata = {
  title: "BLACKBOX: Signal Lost",
  description:
    "An interactive detective game played through a fictional investigation operating system.",
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  themeColor: "#0b0f16",
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <Script
          id="bbx-reduced-motion"
          strategy="beforeInteractive"
          dangerouslySetInnerHTML={{
            __html: `try{document.documentElement.dataset.reducedMotion=window.matchMedia("(prefers-reduced-motion: reduce)").matches?"reduce":"no-preference"}catch(e){}`,
          }}
        />
      </head>
      <body>
        <SkipLink />
        {children}
      </body>
    </html>
  );
}
