import type { Metadata } from "next";
import "./globals.css";
import { Providers } from "./providers";
import { GoogleOAuthProvider } from "@react-oauth/google";

const GOOGLE_CLIENT_ID = process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID ?? "";

export const metadata: Metadata = {
  title: { default: "adda", template: "%s · adda" },
  description: "Self-hosted live streaming for your community.",
  icons: [{ rel: "icon", url: "/favicon.svg", type: "image/svg+xml" }],
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className="dark" suppressHydrationWarning>
      <body className="min-h-screen antialiased">
        <Providers>
          {GOOGLE_CLIENT_ID ? (
            <GoogleOAuthProvider clientId={GOOGLE_CLIENT_ID}>{children}</GoogleOAuthProvider>
          ) : (
            children
          )}
        </Providers>
      </body>
    </html>
  );
}
