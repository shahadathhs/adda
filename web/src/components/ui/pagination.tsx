import Link from "next/link";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { cn } from "@/lib/cn";
import { pageWindow } from "@/lib/page-window";

const cell =
  "grid h-9 min-w-9 place-items-center rounded-sm px-2 font-num text-sm outline-none transition-colors duration-120 focus-visible:outline-2 focus-visible:outline-ring";

/** Numbered pages as links, so each page has its own address. `href(n)` builds that address. */
export function Pagination({
  page,
  pageSize,
  total,
  href,
}: {
  page: number;
  pageSize: number;
  total: number;
  href: (page: number) => string;
}) {
  const pages = Math.max(1, Math.ceil(total / pageSize));
  if (pages <= 1) return null;
  const from = (page - 1) * pageSize + 1;
  const to = Math.min(total, page * pageSize);

  const step = (to: number, label: string, icon: React.ReactNode, off: boolean) =>
    off ? (
      <span className={cn(cell, "pointer-events-none text-muted-foreground/40")} aria-hidden="true">
        {icon}
      </span>
    ) : (
      <Link
        href={href(to)}
        aria-label={label}
        className={cn(cell, "text-muted-foreground hover:bg-secondary hover:text-foreground")}
      >
        {icon}
      </Link>
    );

  return (
    <nav aria-label="Pagination" className="mt-8 flex flex-wrap items-center justify-between gap-3">
      <p className="text-[13px] text-muted-foreground">
        <span className="font-num">
          {from}–{to}
        </span>{" "}
        of <span className="font-num">{total}</span>
      </p>
      <div className="flex items-center gap-1">
        {step(page - 1, "Previous page", <ChevronLeft className="h-4 w-4" />, page <= 1)}
        {pageWindow(page, pages).map((n, i) =>
          n === "gap" ? (
            <span key={`gap-${i}`} className={cn(cell, "text-muted-foreground")} aria-hidden="true">
              …
            </span>
          ) : (
            <Link
              key={n}
              href={href(n)}
              aria-label={`Page ${n}`}
              aria-current={n === page ? "page" : undefined}
              className={cn(
                cell,
                n === page
                  ? "bg-secondary text-foreground"
                  : "text-muted-foreground hover:bg-secondary/60 hover:text-foreground",
              )}
            >
              {n}
            </Link>
          ),
        )}
        {step(page + 1, "Next page", <ChevronRight className="h-4 w-4" />, page >= pages)}
      </div>
    </nav>
  );
}
