"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/cn";

/** Tabs that are routes: the active one is matched on the pathname, with a marigold underline. */
export function RouteTabs({
  tabs,
  label,
  search = "",
  current,
}: {
  tabs: { href: string; label: string }[];
  label: string;
  /** Query string to carry across tabs, such as `?channel=...`. */
  search?: string;
  /** Overrides the route used to pick the active tab (design previews). */
  current?: string;
}) {
  const route = usePathname();
  const pathname = current ?? route;
  return (
    <nav aria-label={label} className="flex gap-1 border-b border-border">
      {tabs.map((t) => {
        const on = pathname === t.href;
        return (
          <Link
            key={t.href}
            href={`${t.href}${search}`}
            aria-current={on ? "page" : undefined}
            className={cn(
              "relative px-3.5 py-2.5 text-sm font-medium outline-none transition-colors duration-120 focus-visible:outline-2 focus-visible:outline-ring",
              on ? "text-foreground" : "text-muted-foreground hover:text-foreground",
            )}
          >
            {t.label}
            {on && (
              <span
                className="absolute inset-x-2.5 -bottom-px h-0.5 bg-primary"
                aria-hidden="true"
              />
            )}
          </Link>
        );
      })}
    </nav>
  );
}
