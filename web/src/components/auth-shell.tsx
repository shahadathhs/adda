"use client";

import Link from "next/link";
import { Check, Radio } from "lucide-react";
import { AuthPreview } from "@/components/auth-preview";

const claims = [
  "Live streams with realtime chat",
  "Every broadcast recorded",
  "Self-hosted: your server, your data",
];

/** Two columns: what adda is (with the live channel, if any) beside the form. */
export function AuthShell({ children }: { children: React.ReactNode }) {
  return (
    <div className="grid min-h-screen lg:grid-cols-[560px_1fr]">
      <aside className="hidden flex-col justify-between border-r border-border bg-card p-10 lg:flex">
        <Link href="/" className="flex items-center gap-2" aria-label="adda home">
          <Radio className="h-[26px] w-[26px] text-primary" aria-hidden="true" />
          <span className="font-display text-[22px] font-bold tracking-tight text-foreground">
            adda
          </span>
        </Link>

        <div>
          <AuthPreview />
          <h2 className="max-w-[420px] font-display text-[28px] font-bold leading-8 tracking-tight text-foreground">
            Your own live-streaming site. Watch, chat, and keep every broadcast.
          </h2>
          <ul className="mt-5 space-y-2 text-sm text-muted-foreground">
            {claims.map((c) => (
              <li key={c} className="flex items-center gap-2">
                <Check className="h-4 w-4" aria-hidden="true" />
                {c}
              </li>
            ))}
          </ul>
        </div>

        <p className="text-xs text-muted-foreground/80">adda runs on the host&apos;s own server.</p>
      </aside>

      <div className="flex min-h-screen flex-col">
        <div className="flex items-center justify-between p-5 lg:hidden">
          <Link href="/" className="flex items-center gap-2" aria-label="adda home">
            <Radio className="h-5 w-5 text-primary" aria-hidden="true" />
            <span className="font-display text-lg font-bold text-foreground">adda</span>
          </Link>
        </div>
        <main className="flex flex-1 items-center justify-center px-6 py-10">
          <div className="w-full max-w-[360px]">{children}</div>
        </main>
      </div>
    </div>
  );
}
