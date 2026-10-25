"use client";

import { Check } from "lucide-react";
import { AuthPreview } from "@/components/auth-preview";

const claims = [
  "Live streams with realtime chat",
  "Every broadcast recorded",
  "Self-hosted: your server, your data",
];

/** Two columns inside the page width: what adda is (with the live channel, if any) beside the form. */
export function AuthShell({ children }: { children: React.ReactNode }) {
  return (
    <div className="grid gap-6 px-4 py-8 sm:px-6 lg:min-h-[calc(100vh-9rem)] lg:grid-cols-[480px_1fr]">
      <aside className="hidden flex-col justify-between rounded-lg border border-border bg-card p-8 lg:flex">
        <AuthPreview />
        <div className="mt-auto">
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
          <p className="mt-8 text-xs text-muted-foreground/80">
            adda runs on the host&apos;s own server.
          </p>
        </div>
      </aside>

      <main className="flex items-center justify-center py-6">
        <div className="w-full max-w-[360px]">{children}</div>
      </main>
    </div>
  );
}
