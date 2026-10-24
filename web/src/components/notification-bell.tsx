"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { Bell } from "lucide-react";
import { NotificationItem } from "@/components/notification-item";
import { useNotifications } from "@/lib/use-notifications";

/** The bell: an unread dot, and a panel with went-live, mention and reply notifications. */
export function NotificationBell() {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const { items, unread, isPending, markRead } = useNotifications();

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
        aria-label={unread > 0 ? `Notifications, ${unread} unread` : "Notifications"}
        aria-haspopup="true"
        aria-expanded={open}
        className="relative grid h-8 w-8 place-items-center rounded-sm text-muted-foreground transition-colors duration-120 hover:bg-secondary hover:text-foreground focus-visible:outline-2 focus-visible:outline-ring"
      >
        <Bell className="h-[18px] w-[18px]" aria-hidden="true" />
        {unread > 0 && (
          <span
            className="absolute right-1 top-1 h-2 w-2 rounded-full border-2 border-background bg-primary"
            aria-hidden="true"
          />
        )}
      </button>
      {open && (
        <div className="absolute right-0 top-10 z-50 w-[22rem] max-w-[calc(100vw-2rem)] rounded-md border border-border bg-popover shadow-[0_8px_32px_rgba(0,0,0,0.6)]">
          <div className="flex items-center justify-between px-4 py-3">
            <p className="text-sm font-semibold text-foreground">
              Notifications
              {unread > 0 && (
                <span className="ml-2 font-num text-xs text-muted-foreground">{unread} new</span>
              )}
            </p>
            {unread > 0 && (
              <button
                type="button"
                onClick={() => markRead()}
                className="text-xs text-primary hover:underline"
              >
                Mark all read
              </button>
            )}
          </div>
          <div className="max-h-96 overflow-y-auto border-t border-border p-1">
            {isPending ? (
              <p className="p-4 text-[13px] text-muted-foreground" role="status">
                Loading…
              </p>
            ) : items.length === 0 ? (
              <p className="p-4 text-[13px] text-muted-foreground">
                Nothing yet. When a channel you follow goes live, or someone mentions or replies to
                you, it shows up here.
              </p>
            ) : (
              <ul>
                {items.map((n) => (
                  <NotificationItem
                    key={n.id}
                    n={n}
                    onOpen={() => {
                      if (!n.read) markRead([n.id]);
                      setOpen(false);
                    }}
                  />
                ))}
              </ul>
            )}
          </div>
          <div className="border-t border-border px-4 py-2.5 text-right">
            <Link
              href="/settings/notifications"
              onClick={() => setOpen(false)}
              className="text-xs text-muted-foreground hover:text-foreground"
            >
              Notification settings
            </Link>
          </div>
        </div>
      )}
    </div>
  );
}
