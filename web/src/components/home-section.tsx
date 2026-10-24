import Link from "next/link";
import type { ReactNode } from "react";

/**
 * Permanent section skeleton (the home-page law): the frame always
 * renders — header + optional view-all — and `empty` is the in-section
 * state when there's no data. Sections never unmount.
 */
export function HomeSection({
  title,
  count,
  viewAllHref,
  empty,
  children,
}: {
  title: string;
  count?: number;
  viewAllHref?: string;
  empty?: string;
  children: ReactNode;
}) {
  const hasData = count === undefined || count > 0;
  return (
    <section className="space-y-3">
      <div className="flex items-baseline justify-between gap-3">
        <h2 className="font-display text-lg font-bold tracking-tight text-foreground">
          {title}
          {count !== undefined && (
            <span className="ml-2 text-sm font-normal text-muted-foreground">
              <span className="font-num">{count}</span>
            </span>
          )}
        </h2>
        {hasData && viewAllHref && (
          <Link
            href={viewAllHref}
            className="text-sm text-muted-foreground transition-colors hover:text-foreground"
          >
            View all
          </Link>
        )}
      </div>
      {hasData ? children : <p className="text-sm text-muted-foreground">{empty}</p>}
    </section>
  );
}
