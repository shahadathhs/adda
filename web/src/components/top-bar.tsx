"use client";

import Link from "next/link";
import { usePathname, useSearchParams } from "next/navigation";
import { Radio } from "lucide-react";
import { Button } from "@/components/ui/button";
import { NotificationBell } from "@/components/notification-bell";
import { SearchBox } from "@/components/search-box";
import { UserMenu } from "@/components/user-menu";
import { useMe } from "@/lib/session";
import { cn } from "@/lib/cn";

const navLink = (active: boolean) =>
  cn(
    "rounded-sm px-3 py-1.5 text-sm font-medium outline-none transition-colors duration-120 focus-visible:outline-2 focus-visible:outline-ring",
    active ? "text-foreground" : "text-muted-foreground hover:text-foreground",
  );

/** Brand, Following / Browse, search, then the bell and avatar (or sign-in for guests). */
export function TopBar() {
  const { data: user } = useMe();
  const pathname = usePathname();
  const following = useSearchParams().get("tab") === "following";
  const onHome = pathname === "/";

  return (
    <header className="sticky top-0 z-40 border-b border-border bg-background">
      <div className="flex h-14 items-center gap-5 px-4 sm:px-6">
        <Link href="/" className="flex items-center gap-2" aria-label="adda home">
          <Radio className="h-5 w-5 text-primary" aria-hidden="true" />
          <span className="font-display text-lg font-bold tracking-tight text-foreground">
            adda
          </span>
        </Link>

        <nav className="flex items-center gap-1" aria-label="Primary">
          {user && (
            <Link
              href="/?tab=following"
              className={navLink(onHome && following)}
              aria-current={onHome && following ? "page" : undefined}
            >
              Following
            </Link>
          )}
          <Link
            href="/"
            className={navLink(onHome && !following)}
            aria-current={onHome && !following ? "page" : undefined}
          >
            Browse
          </Link>
        </nav>

        <SearchBox />

        <div className="ml-auto flex items-center gap-3 sm:ml-0">
          {user ? (
            <>
              <NotificationBell />
              <UserMenu />
            </>
          ) : (
            <>
              <Link href="/login">
                <Button variant="ghost" size="md">
                  Sign in
                </Button>
              </Link>
              <Link href="/register" className="hidden sm:block">
                <Button variant="primary" size="md">
                  Create account
                </Button>
              </Link>
            </>
          )}
        </div>
      </div>
    </header>
  );
}
