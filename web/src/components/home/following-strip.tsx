"use client";

import Link from "next/link";
import { useQuery } from "@tanstack/react-query";
import { listFollowed } from "@/lib/api";
import type { DiscoverChannel } from "@/lib/types";
import { useMe } from "@/lib/session";
import { UserAvatar } from "@/components/ui/primitives";
import { cn } from "@/lib/cn";

/** Below the desktop rail breakpoint: followed channels as avatars, ringed in red when live. */
export function FollowingStrip({ channels }: { channels: DiscoverChannel[] }) {
  const { data: user } = useMe();
  const { data: followed } = useQuery({
    queryKey: ["followed"],
    queryFn: listFollowed,
    enabled: !!user,
  });
  if (!user || !followed?.length) return null;

  const live = new Set(channels.filter((c) => c.is_live).map((c) => c.community_id));
  const rows = [...followed].sort((a, b) => Number(live.has(b.id)) - Number(live.has(a.id)));

  return (
    <section aria-label="Following" className="lg:hidden">
      <h2 className="mb-2.5 text-[11px] font-semibold uppercase tracking-[0.08em] text-muted-foreground">
        Following
      </h2>
      <ul className="-mx-4 flex gap-3.5 overflow-x-auto px-4 pb-1 sm:-mx-6 sm:px-6">
        {rows.map((f) => {
          const on = live.has(f.id);
          return (
            <li key={f.id} className="w-[58px] shrink-0">
              <Link
                href={`/channel/${f.slug}`}
                className="flex flex-col items-center gap-1.5 outline-none focus-visible:outline-2 focus-visible:outline-ring"
              >
                <span
                  className={cn(
                    "rounded-full p-0.5",
                    on ? "ring-2 ring-live" : "opacity-60 ring-1 ring-border",
                  )}
                >
                  <UserAvatar name={f.name} src={f.avatar_url} className="h-11 w-11 text-sm" />
                </span>
                <span className="w-full truncate text-center text-[11px] text-muted-foreground">
                  {f.name}
                </span>
                <span className="sr-only">{on ? "Live" : "Offline"}</span>
              </Link>
            </li>
          );
        })}
      </ul>
    </section>
  );
}
