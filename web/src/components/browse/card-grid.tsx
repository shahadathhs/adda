import type { ReactNode } from "react";
import { Reveal } from "@/components/reveal";

export const CARD_GRID = "grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4";

/** A responsive grid whose cards reveal in turn as they scroll into view. */
export function CardGrid({ children }: { children: ReactNode[] }) {
  return (
    <div className={CARD_GRID}>
      {children.map((child, i) => (
        <Reveal key={i} delay={(i % 4) * 50}>
          {child}
        </Reveal>
      ))}
    </div>
  );
}

/** Placeholder cards while a page loads, shaped like the real ones so nothing jumps. */
export function CardSkeletons({ count = 8 }: { count?: number }) {
  return (
    <div className={CARD_GRID} aria-hidden="true">
      {Array.from({ length: count }, (_, i) => (
        <div key={i} className="overflow-hidden rounded-lg border border-border bg-card">
          <div className="aspect-video animate-pulse border-b border-border bg-secondary/50" />
          <div className="flex gap-2.5 px-3 pb-3 pt-2.5">
            <div className="h-9 w-9 animate-pulse rounded-full bg-secondary/50" />
            <div className="flex-1 space-y-2 pt-1">
              <div className="h-3 w-3/4 animate-pulse rounded-xs bg-secondary/50" />
              <div className="h-3 w-1/2 animate-pulse rounded-xs bg-secondary/50" />
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}
