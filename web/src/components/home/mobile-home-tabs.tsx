"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { useMe } from "@/lib/session";
import { cn } from "@/lib/cn";

/** Phone-only switch between Browse and Following (the top-bar links are hidden there). */
export function MobileHomeTabs() {
  const { data: user } = useMe();
  const following = useSearchParams().get("tab") === "following";
  if (!user) return null;
  const tab = (on: boolean) =>
    cn(
      "flex-1 rounded-sm py-2 text-center text-sm font-medium outline-none transition-colors duration-120 focus-visible:outline-2 focus-visible:outline-ring",
      on ? "bg-secondary text-foreground" : "text-muted-foreground",
    );
  return (
    <nav
      aria-label="Home sections"
      className="flex rounded-md border border-border bg-card p-0.5 sm:hidden"
    >
      <Link href="/" className={tab(!following)} aria-current={!following ? "page" : undefined}>
        Browse
      </Link>
      <Link
        href="/?tab=following"
        className={tab(following)}
        aria-current={following ? "page" : undefined}
      >
        Following
      </Link>
    </nav>
  );
}
