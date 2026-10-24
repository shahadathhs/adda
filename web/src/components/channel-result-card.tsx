"use client";

import Link from "next/link";
import type { DiscoverChannel } from "@/lib/types";
import { LiveBadge, UserAvatar } from "@/components/ui/primitives";
import { StreamThumb } from "@/components/stream-thumb";
import { ViewerCount } from "@/components/viewer-count";

const compact = (n: number) =>
  n >= 1000 ? `${(n / 1000).toFixed(n >= 10_000 ? 0 : 1).replace(/\.0$/, "")}k` : String(n);

/** A search result: the channel, its follower count, and the stream title or about line. */
export function ChannelResultCard({ channel: c }: { channel: DiscoverChannel }) {
  return (
    <Link
      href={`/channel/${c.slug}`}
      className="group block overflow-hidden rounded-lg border border-border bg-card outline-none transition-[translate,border-color] duration-120 ease-[var(--ease-micro)] hover:-translate-y-0.5 hover:border-muted-foreground/40 focus-visible:outline-2 focus-visible:outline-ring"
    >
      <div className="relative border-b border-border">
        <StreamThumb communityId={c.community_id} name={c.name} />
        <div className="absolute left-2 top-2">
          {c.is_live ? (
            <LiveBadge />
          ) : (
            <span className="rounded-xs bg-black/60 px-1.5 py-px text-[11px] font-bold uppercase tracking-wide text-white/80">
              Offline
            </span>
          )}
        </div>
        {c.is_live && (
          <div className="absolute bottom-2 left-2">
            <ViewerCount viewers={c.viewers} />
          </div>
        )}
      </div>
      <div className="flex gap-2.5 px-3 pb-3 pt-2.5">
        <UserAvatar name={c.name} src={c.avatar_url} className="h-9 w-9 text-[13px]" />
        <div className="min-w-0 flex-1">
          <div className="flex items-baseline justify-between gap-2">
            <p className="truncate text-sm font-semibold text-foreground">{c.name}</p>
            <span
              className="font-num text-xs text-muted-foreground"
              title={`${c.follower_count.toLocaleString()} followers`}
            >
              {compact(c.follower_count)}
            </span>
          </div>
          <p className="truncate text-[13px] text-muted-foreground">
            {(c.is_live ? c.stream_title : null) || c.description || `@${c.slug}`}
          </p>
        </div>
      </div>
    </Link>
  );
}
