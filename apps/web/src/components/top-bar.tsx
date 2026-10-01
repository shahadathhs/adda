"use client";

import { useEffect, useRef } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { LogOut, UserCircle } from "lucide-react";
import { UserAvatar } from "@/components/ui/primitives";
import { Button } from "@/components/ui/button";
import { useMe, useLogout } from "@/lib/session";

export function TopBar() {
  const { data: user } = useMe();
  const logout = useLogout();
  const router = useRouter();

  return (
    <header className="sticky top-0 z-40 border-b border-border bg-background/80 backdrop-blur">
      <div className="mx-auto flex h-12 max-w-6xl items-center gap-4 px-4">
        <Link href="/" className="text-lg font-extrabold tracking-tight">
          adda
        </Link>
        <nav className="flex items-center gap-3 text-sm text-muted-foreground">
          <Link href="/" className="hover:text-foreground">
            Browse
          </Link>
        </nav>
        <div className="ml-auto flex items-center gap-2">
          {user ? (
            <>
              <Link
                href="/settings"
                className="flex items-center gap-2 rounded-md px-2 py-1 hover:bg-accent"
              >
                <UserAvatar
                  name={user.display_name}
                  src={user.avatar_url}
                  className="h-7 w-7 text-xs"
                />
                <span className="hidden text-sm sm:inline">{user.display_name}</span>
              </Link>
              <Button
                variant="ghost"
                size="sm"
                title="Sign out"
                onClick={() =>
                  logout.mutate(undefined, {
                    onSuccess: () => router.push("/login"),
                  })
                }
              >
                <LogOut className="h-4 w-4" />
              </Button>
            </>
          ) : (
            <>
              <Link href="/login">
                <Button variant="ghost" size="sm">
                  Sign in
                </Button>
              </Link>
              <Link href="/register">
                <Button size="sm">Get started</Button>
              </Link>
            </>
          )}
        </div>
      </div>
    </header>
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

  if (isPending) return <p className="p-10 text-center text-muted-foreground">Loading…</p>;
  if (!user)
    return (
      <div className="flex min-h-[50vh] flex-col items-center justify-center gap-3">
        <UserCircle className="h-8 w-8 text-muted-foreground/40" />
        <p className="text-sm text-muted-foreground">Sign in to continue.</p>
        <Link href="/login">
          <Button size="sm">Sign in</Button>
        </Link>
      </div>
    );
  return <>{children}</>;
}
