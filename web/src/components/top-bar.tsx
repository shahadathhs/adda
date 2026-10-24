"use client";

import Link from "next/link";
import { usePathname, useSearchParams } from "next/navigation";
import { Radio, Search } from "lucide-react";
import { buttonClass } from "@/components/ui/button-styles";
import { NotificationBell } from "@/components/notification-bell";
import { PageContainer } from "@/components/page-container";
import { GlobalSearch } from "@/components/search/global-search";
import { UserMenu } from "@/components/user-menu";
import { useMe } from "@/lib/session";
import { cn } from "@/lib/cn";

const navLink = (active: boolean) =>
  cn(
    "rounded-sm px-3 py-1.5 text-sm font-medium outline-none transition-colors duration-120 focus-visible:outline-2 focus-visible:outline-ring",
    active ? "text-foreground" : "text-muted-foreground hover:text-foreground",
  );

const SECTIONS = [
  { href: "/live", label: "Live" },
  { href: "/channels", label: "Channels" },
  { href: "/videos", label: "Videos" },
  { href: "/recordings", label: "Recordings" },
];

/** Brand, section links, the search box (on every page), then the bell and avatar (or sign-in for guests). */
export function TopBar() {
  const { data: user } = useMe();
  const pathname = usePathname();
  const onAuthPage = ["/login", "/register", "/forgot-password", "/reset-password"].some((p) =>
    pathname?.startsWith(p),
  );

  return (
    <header className="sticky top-0 z-40 border-b border-border bg-background">
      <PageContainer className="flex h-14 items-center gap-5 px-4 sm:px-6">
        <Link href="/" className="flex items-center gap-2" aria-label="adda home">
          <Radio className="h-5 w-5 text-primary" aria-hidden="true" />
          <span className="font-display text-lg font-bold tracking-tight text-foreground">
            adda
          </span>
        </Link>

        <SectionNav className="hidden sm:flex" />

        <GlobalSearch className="hidden w-full max-w-[420px] flex-1 sm:block" />

        <div className="ml-auto flex items-center gap-3">
          <Link
            href="/search"
            aria-label="Search channels"
            className="grid h-8 w-8 place-items-center rounded-sm text-muted-foreground hover:bg-secondary hover:text-foreground sm:hidden"
          >
            <Search className="h-[18px] w-[18px]" aria-hidden="true" />
          </Link>
          {user ? (
            <>
              <NotificationBell />
              <UserMenu />
            </>
          ) : (
            !onAuthPage && (
              <>
                <Link href="/login" className={buttonClass("ghost")}>
                  Sign in
                </Link>
                <Link
                  href="/register"
                  className={buttonClass("primary", "md", "hidden sm:inline-flex")}
                >
                  Create account
                </Link>
              </>
            )
          )}
        </div>
      </PageContainer>
      <SectionNav className="flex gap-1 overflow-x-auto border-t border-border px-4 py-1 sm:hidden" />
    </header>
  );
}

/** Following (signed in), Live, Channels and Recordings; the current one is marked. */
function SectionNav({ className }: { className: string }) {
  const { data: user } = useMe();
  const pathname = usePathname();
  const following = useSearchParams().get("tab") === "following";
  const onFollowing = pathname === "/" && following;
  return (
    <nav aria-label="Primary" className={cn("items-center gap-1", className)}>
      {user && (
        <Link
          href="/?tab=following"
          className={navLink(onFollowing)}
          aria-current={onFollowing ? "page" : undefined}
        >
          Following
        </Link>
      )}
      {SECTIONS.map((s) => {
        const on = pathname === s.href || pathname?.startsWith(`${s.href}/`);
        return (
          <Link
            key={s.href}
            href={s.href}
            className={navLink(!!on)}
            aria-current={on ? "page" : undefined}
          >
            {s.label}
          </Link>
        );
      })}
    </nav>
  );
}
