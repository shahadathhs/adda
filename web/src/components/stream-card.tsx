"use client";

import Link from "next/link";
import type { DiscoverChannel } from "@/lib/types";
import { LiveBadge, UserAvatar } from "@/components/ui/primitives";
import { StreamThumb } from "@/components/stream-thumb";
import { ViewerCount } from "@/components/viewer-count";

/**
 * The stream card: 16:9 frame, LIVE badge top-left, viewer count bottom-left,
 * then avatar, stream title and channel name. Offline channels show the last
 * frame with an OFFLINE tag instead.
 */
export function StreamCard({ channel: c }: { channel: DiscoverChannel }) {
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
        <div className="min-w-0">
          <p className="truncate text-sm font-semibold text-foreground">
            {(c.is_live && c.stream_title) || c.name}
          </p>
          <p className="truncate text-[13px] text-muted-foreground">
            {c.is_live ? c.name : `@${c.slug}`}
          </p>
        </div>
      </div>
    </Link>
  );
}
