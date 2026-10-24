"use client";

import { useEffect, useRef, useState } from "react";
import { Bell } from "lucide-react";

/**
 * The bell. Notifications arrive in M3; until then the panel says so
 * honestly instead of faking entries.
 */
export function NotificationBell() {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const close = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    const esc = (e: KeyboardEvent) => e.key === "Escape" && setOpen(false);
    document.addEventListener("mousedown", close);
    document.addEventListener("keydown", esc);
    return () => {
      document.removeEventListener("mousedown", close);
      document.removeEventListener("keydown", esc);
    };
  }, [open]);

  return (
    <div className="relative" ref={ref}>
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-label="Notifications"
        aria-haspopup="true"
        aria-expanded={open}
        className="grid h-8 w-8 place-items-center rounded-sm text-muted-foreground transition-colors duration-120 hover:bg-secondary hover:text-foreground focus-visible:outline-2 focus-visible:outline-ring"
      >
        <Bell className="h-[18px] w-[18px]" aria-hidden="true" />
      </button>
      {open && (
        <div className="absolute right-0 top-10 z-50 w-80 rounded-md border border-border bg-popover p-4 shadow-[0_8px_32px_rgba(0,0,0,0.6)]">
          <p className="text-sm font-semibold text-foreground">Notifications</p>
          <p className="mt-1 text-[13px] text-muted-foreground">
            Nothing yet. When a channel you follow goes live, or someone mentions or replies to you,
            it shows up here.
          </p>
        </div>
      )}
    </div>
  );
}
