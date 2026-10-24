"use client";

import { useEffect, useRef } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { UserCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useMe } from "@/lib/session";
import { SiteFooter } from "@/components/site-footer";
import { PageContainer } from "@/components/page-container";
import { TopBar } from "@/components/top-bar";

const AUTH_PREFIXES = ["/login", "/register", "/reset-password", "/forgot-password"];

/** App chrome: the top bar over the page, then the footer. Auth pages render bare. */
export function AppShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  if (AUTH_PREFIXES.some((p) => pathname?.startsWith(p))) return <>{children}</>;

  return (
    <div className="flex min-h-screen flex-col">
      <TopBar />
      <div className="flex-1">
        <PageContainer>{children}</PageContainer>
      </div>
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
