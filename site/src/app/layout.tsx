import type { Metadata } from "next";
import localFont from "next/font/local";
import "./globals.css";
import { MotionProvider } from "@/components/motion-provider";
import { ScrollProgress } from "@/components/scroll-progress";
import { SiteFooter } from "@/components/site-footer";
import { SiteHeader } from "@/components/site-header";
import { SITE } from "@/lib/site";

const spaceGrotesk = localFont({
  src: "../../public/fonts/space-grotesk-var.woff2",
  variable: "--font-space-grotesk",
  weight: "500 700",
  display: "swap",
});

export const metadata: Metadata = {
  metadataBase: new URL(SITE.url),
  title: { default: `adda — ${SITE.tagline}`, template: "%s · adda" },
  description: SITE.description,
  icons: [{ rel: "icon", url: "/favicon.svg", type: "image/svg+xml" }],
  openGraph: {
    title: `adda — ${SITE.tagline}`,
    description: SITE.description,
    siteName: "adda",
    type: "website",
    images: [{ url: "/screens/channel-live.png", width: 1440, height: 900 }],
  },
  twitter: { card: "summary_large_image" },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`dark ${spaceGrotesk.variable}`}>
      <body className="flex min-h-screen flex-col">
        <noscript>
          {/* Scroll animations start hidden; without JavaScript nothing may stay that way. */}
          <style>{`[data-reveal]{opacity:1!important;transform:none!important}[data-draw]{opacity:1!important;stroke-dasharray:none!important;stroke-dashoffset:0!important}`}</style>
        </noscript>
        <MotionProvider>
          <SiteHeader />
          <ScrollProgress />
          <div className="flex-1">{children}</div>
          <SiteFooter />
        </MotionProvider>
      </body>
    </html>
  );
}
