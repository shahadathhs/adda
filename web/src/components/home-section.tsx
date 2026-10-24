import type { ReactNode } from "react";

/**
 * A titled section that always renders its header; `empty` is the in-section
 * state when there is nothing to show, so the page never reflows or unmounts.
 */
export function HomeSection({
  title,
  count,
  hint,
  empty,
  children,
}: {
  title: string;
  count?: number;
  hint?: string;
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
        {hasData && hint && <span className="text-[13px] text-muted-foreground">{hint}</span>}
      </div>
      {hasData ? children : <p className="text-sm text-muted-foreground">{empty}</p>}
    </section>
  );
}
