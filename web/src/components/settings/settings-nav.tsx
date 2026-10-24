"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/cn";

const ITEMS = [
  { href: "/settings", label: "Profile" },
  { href: "/settings/password", label: "Password" },
];

/** Vertical section nav for the settings pages. `current` overrides the route (design previews). */
export function SettingsNav({ current }: { current?: string }) {
  const route = usePathname();
  const pathname = current ?? route;
  return (
    <nav aria-label="Settings" className="flex gap-1 lg:flex-col">
      {ITEMS.map((item) => {
        const on = pathname === item.href;
        return (
          <Link
            key={item.href}
            href={item.href}
            aria-current={on ? "page" : undefined}
            className={cn(
              "rounded-sm px-3 py-2 text-sm font-medium outline-none transition-colors duration-120 focus-visible:outline-2 focus-visible:outline-ring",
              on
                ? "bg-secondary text-foreground"
                : "text-muted-foreground hover:bg-secondary/60 hover:text-foreground",
            )}
          >
            {item.label}
          </Link>
        );
      })}
    </nav>
  );
}
