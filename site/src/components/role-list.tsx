"use client";

import { useState } from "react";
import { Check } from "lucide-react";

/** The first `CHAIN` roles build on each other; the last one (admin) is a separate API. */
const CHAIN = 4;

/**
 * Who can do what. Hover or focus a role and the ones it builds on are marked "included", so the
 * rule that an owner can do everything a guest, an account and a moderator can is visible.
 */
export function RoleList({ roles }: { roles: [string, string][] }) {
  const [active, setActive] = useState<number | null>(null);

  return (
    <dl
      className="divide-y divide-border overflow-hidden rounded-lg border border-border bg-card"
      onMouseLeave={() => setActive(null)}
    >
      {roles.map(([who, what], i) => {
        const on = active === i;
        const included = active !== null && active < CHAIN && i < active;
        return (
          <div
            key={who}
            tabIndex={0}
            onMouseEnter={() => setActive(i)}
            onFocus={() => setActive(i)}
            onBlur={() => setActive(null)}
            className={`relative grid gap-1 px-5 py-3.5 outline-none transition-colors duration-[120ms] sm:grid-cols-[7rem_1fr_auto] sm:gap-4 ${
              on ? "bg-secondary" : included ? "bg-secondary/40" : ""
            }`}
          >
            <span
              aria-hidden="true"
              className={`absolute inset-y-0 left-0 w-0.5 origin-center bg-primary transition-transform duration-[120ms] ${
                on || included ? "scale-y-100" : "scale-y-0"
              }`}
            />
            <dt className="font-semibold">{who}</dt>
            <dd className="text-sm text-muted-foreground">{what}</dd>
            <span
              className={`hidden items-center gap-1 text-xs text-muted-foreground transition-opacity duration-[120ms] sm:flex ${
                included ? "opacity-100" : "opacity-0"
              }`}
              aria-hidden={!included}
            >
              <Check className="h-3.5 w-3.5 text-ok" aria-hidden="true" />
              included
            </span>
          </div>
        );
      })}
    </dl>
  );
}
