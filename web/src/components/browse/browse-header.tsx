import type { ReactNode } from "react";

/** Eyebrow, page title and a one-line summary, with room for actions on the right. */
export function BrowseHeader({
  eyebrow,
  title,
  summary,
  children,
}: {
  eyebrow: string;
  title: string;
  summary?: ReactNode;
  children?: ReactNode;
}) {
  return (
    <div className="flex flex-wrap items-end justify-between gap-4">
      <div>
        <p className="text-[11px] font-semibold uppercase tracking-[0.08em] text-muted-foreground">
          {eyebrow}
        </p>
        <h1 className="mt-1 font-display text-[28px] font-bold leading-8 tracking-tight text-foreground">
          {title}
        </h1>
        {summary && <p className="mt-1 text-[13px] text-muted-foreground">{summary}</p>}
      </div>
      {children}
    </div>
  );
}
