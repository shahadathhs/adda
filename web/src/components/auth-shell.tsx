"use client";

import Link from "next/link";
import { Radio } from "lucide-react";

const claims = [
  "Live streams with real-time chat",
  "Recordings of every broadcast",
  "Self-hosted — your server, your data",
];

/**
 * Auth layout — split screen: brand panel (identity sells while you
 * type) + the form. The bare-form look was the bug.
 */
export function AuthShell({ children }: { children: React.ReactNode }) {
  return (
    <div className="grid min-h-screen lg:grid-cols-2">
      {/* Brand panel */}
      <aside className="relative hidden flex-col justify-between border-r border-border bg-card/40 p-10 lg:flex">
        <Link href="/" className="flex items-center gap-2">
          <Radio className="h-5 w-5 text-primary" aria-hidden="true" />
          <span className="font-display text-lg font-bold tracking-tight text-foreground">
            adda
          </span>
        </Link>

        <div className="space-y-5">
          <span className="live-dot" aria-hidden="true" />
          <h2 className="max-w-md font-display text-4xl font-bold leading-[1.05] tracking-tight text-foreground">
            Your community&apos;s live home.
          </h2>
          <ul className="space-y-2.5">
            {claims.map((c) => (
              <li key={c} className="flex items-center gap-2.5 text-sm text-muted-foreground">
                <span className="h-1.5 w-1.5 rounded-full bg-primary" aria-hidden="true" />
                {c}
              </li>
            ))}
          </ul>
        </div>

        <p className="text-xs text-muted-foreground">
          <span lang="bn">আড্ডা</span> — an informal conversation among friends.
        </p>
      </aside>

      {/* Form column */}
      <div className="flex min-h-screen flex-col">
        <div className="flex items-center justify-between p-5 lg:hidden">
          <Link href="/" className="flex items-center gap-2">
            <Radio className="h-5 w-5 text-primary" aria-hidden="true" />
            <span className="font-display text-lg font-bold text-foreground">adda</span>
          </Link>
          <Link
            href="/"
            className="text-xs text-muted-foreground transition-colors hover:text-foreground"
          >
            ← Back to browse
          </Link>
        </div>
        <div className="flex flex-1 items-center justify-center p-6">
          <div className="w-full max-w-sm">{children}</div>
        </div>
      </div>
    </div>
  );
}
