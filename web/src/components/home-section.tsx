import type { ReactNode } from "react";
import Link from "next/link";
import { ArrowRight } from "lucide-react";

/**
 * A titled section that always renders its header; `empty` is the in-section
 * state when there is nothing to show, so the page never reflows or unmounts.
 */
export function HomeSection({
  title,
  count,
  hint,
  href,
  empty,
  children,
}: {
  title: string;
  count?: number;
  hint?: string;
  /** The dedicated page for this section; shown as "View all". */
  href?: string;
  empty: string;
  children: ReactNode;
}) {
  const hasData = count === undefined || count > 0;
  return (
    <section className="space-y-3.5">
      <div className="flex items-baseline justify-between gap-3">
        <h2 className="font-display text-xl font-semibold tracking-tight text-foreground">
          {title}
          {count !== undefined && (
            <span className="ml-2 font-num text-sm font-medium text-muted-foreground">{count}</span>
          )}
        </h2>
        {hasData && (
          <span className="flex items-center gap-4 text-[13px] text-muted-foreground">
            {hint && <span className="hidden sm:inline">{hint}</span>}
            {href && (
              <Link
                href={href}
                className="inline-flex items-center gap-1 rounded-sm font-medium text-primary outline-none hover:underline focus-visible:outline-2 focus-visible:outline-ring"
              >
                View all
                <ArrowRight className="h-3.5 w-3.5" aria-hidden="true" />
              </Link>
            )}
          </span>
        )}
      </div>
      {hasData ? children : <p className="text-sm text-muted-foreground">{empty}</p>}
    </section>
  );
}
