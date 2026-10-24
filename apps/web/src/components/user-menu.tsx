"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { LogOut, Settings, Wand2 } from "lucide-react";
import { UserAvatar } from "@/components/ui/primitives";
import { useMe, useLogout } from "@/lib/session";

/**
 * Avatar dropdown — personal tools live here, not in the nav
 * (Studio / Settings / Sign out), streaming-platform style.
 */
export function UserMenu() {
  const { data: user } = useMe();
  const logout = useLogout();
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const close = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", close);
    return () => document.removeEventListener("mousedown", close);
  }, [open]);

  if (!user) return null;

  const item =
    "flex w-full cursor-pointer items-center gap-3 rounded-sm px-3 py-2 text-left text-sm text-muted-foreground transition-colors duration-120 hover:bg-secondary hover:text-foreground";

  return (
    <div className="relative" ref={ref}>
      <button
        onClick={() => setOpen((v) => !v)}
        className="flex cursor-pointer items-center gap-2 rounded-sm p-1 transition-colors hover:bg-accent"
        aria-haspopup="menu"
        aria-expanded={open}
        aria-label="Account menu"
      >
        <UserAvatar name={user.display_name} src={user.avatar_url} className="h-8 w-8 text-xs" />
      </button>

      {open && (
        <div
          role="menu"
          className="absolute right-0 top-11 w-60 rounded-md border border-border bg-popover p-1.5 shadow-[0_8px_32px_rgba(0,0,0,0.6)]"
        >
          <div className="border-b border-border px-3 py-2.5">
            <p className="truncate text-sm font-semibold text-foreground">{user.display_name}</p>
            <p className="truncate text-xs text-muted-foreground">@{user.username}</p>
          </div>

          <div className="p-1">
            <Link
              href="/dashboard?tab=studio"
              role="menuitem"
              className={item}
              onClick={() => setOpen(false)}
            >
              <Wand2 className="h-4 w-4" aria-hidden="true" />
              Studio
            </Link>
            <Link
              href="/dashboard?tab=settings"
              role="menuitem"
              className={item}
              onClick={() => setOpen(false)}
            >
              <Settings className="h-4 w-4" aria-hidden="true" />
              Settings
            </Link>
          </div>

          <div className="border-t border-border p-1">
            <button
              role="menuitem"
              className={item}
              onClick={() => {
                setOpen(false);
                logout.mutate(undefined, { onSuccess: () => router.push("/login") });
              }}
            >
              <LogOut className="h-4 w-4" aria-hidden="true" />
              Sign out
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
