"use client";

import { useEffect, useRef } from "react";
import Link from "next/link";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { ExternalLink, Radio, UserCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useMe } from "@/lib/session";
import { UserMenu } from "@/components/user-menu";
import { SiteFooter } from "@/components/site-footer";
import { cn } from "@/lib/cn";

// Where the product's public faces live (marketing site is a dummy until launch).
const MARKETING_URL = "https://adda.vercel.app";
const CREATOR_URL = "https://shahadathhs.vercel.app";

const AUTH_PREFIXES = ["/login", "/register", "/reset-password"];

/**
 * App chrome — top navigation, viewer-first: brand (home), Following,
 * centered search, external links, single auth button, avatar dropdown
 * for personal tools. Auth pages render bare (form only).
 */
export function AppShell({ children }: { children: React.ReactNode }) {
  const { data: user } = useMe();
  const router = useRouter();
  const pathname = usePathname();
  const params = useSearchParams();
  const followingTab = params.get("tab") === "following";
  const bare = AUTH_PREFIXES.some((p) => pathname?.startsWith(p));

  if (bare) return <>{children}</>;

  return (
    <div className="flex min-h-screen flex-col">
      <header className="sticky top-0 z-40 border-b border-border bg-background/85 backdrop-blur">
        <div className="mx-auto flex h-14 max-w-7xl items-center gap-5 px-4 sm:px-6">
          <Link href="/" className="flex items-center gap-2" aria-label="adda home">
            <Radio className="h-5 w-5 text-primary" aria-hidden="true" />
            <span className="font-display text-lg font-bold tracking-tight text-foreground">
              adda
            </span>
          </Link>

          <nav className="flex items-center gap-1 text-sm font-medium" aria-label="Primary">
            {user && (
              <Link
                href="/?tab=following"
                className={cn(
                  "rounded-sm px-3 py-1.5 outline-none transition-colors duration-120 focus-visible:outline-2 focus-visible:outline-ring",
                  followingTab && pathname === "/"
                    ? "text-foreground"
                    : "text-muted-foreground hover:text-foreground",
                )}
                aria-current={followingTab && pathname === "/" ? "page" : undefined}
              >
                Following
              </Link>
            )}
          </nav>

          {/* Search — centered like the mock; lands on the home grid. */}
          <form
            className="mx-auto hidden w-full max-w-md sm:block"
            onSubmit={(e) => {
              e.preventDefault();
              const q = new FormData(e.currentTarget).get("q");
              router.push(q ? `/?q=${encodeURIComponent(String(q))}` : "/");
            }}
          >
            <input
              name="q"
              placeholder="Search channels…"
              className="h-9 w-full rounded-md border border-input bg-input/50 px-4 text-sm text-foreground placeholder:text-muted-foreground focus-visible:outline-2 focus-visible:outline-ring"
              aria-label="Search channels"
            />
          </form>

          <div className="ml-auto flex items-center gap-4 sm:ml-0">
            <div className="hidden items-center gap-3 text-xs text-muted-foreground md:flex">
              <a
                href={MARKETING_URL}
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center gap-1 transition-colors hover:text-foreground"
              >
                Website
                <ExternalLink className="h-3 w-3" aria-hidden="true" />
              </a>
              <a
                href={CREATOR_URL}
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center gap-1 transition-colors hover:text-foreground"
              >
                Creator
                <ExternalLink className="h-3 w-3" aria-hidden="true" />
              </a>
            </div>

            <div className="flex items-center gap-2 border-l border-border pl-4">
              {user ? (
                <UserMenu />
              ) : (
                <Link href="/login">
                  <Button variant="primary" size="sm">
                    Sign in
                  </Button>
                </Link>
              )}
            </div>
          </div>
        </div>
      </header>

      <div className="flex-1">{children}</div>
      <SiteFooter />
    </div>
  );
}

export function RequireAuth({ children }: { children: React.ReactNode }) {
  const { data: user, isPending } = useMe();
  const router = useRouter();
  const checked = useRef(false);

  useEffect(() => {
    if (!isPending && !user && !checked.current) {
      checked.current = true;
      router.replace("/login");
    }
  }, [isPending, user, router]);

  if (isPending) return <p className="p-10 text-center text-sm text-muted-foreground">Loading…</p>;
  if (!user)
    return (
      <div className="flex min-h-[50vh] flex-col items-center justify-center gap-3">
        <UserCircle className="h-8 w-8 text-muted-foreground/40" aria-hidden="true" />
        <p className="text-sm text-muted-foreground">Sign in to continue.</p>
        <Link href="/login">
          <Button size="sm" variant="primary">
            Sign in
          </Button>
        </Link>
      </div>
    );
  return <>{children}</>;
}
