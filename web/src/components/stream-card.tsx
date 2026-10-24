"use client";

import Link from "next/link";
import { useState } from "react";
import { Eye } from "lucide-react";
import type { DiscoverChannel } from "@/lib/types";
import { thumbUrl } from "@/lib/data";
import { LiveBadge } from "@/components/ui/primitives";
import { cn } from "@/lib/cn";

/**
 * The stream card — ported 1:1 from the approved site hero mock
 * (DESIGN.md §7): 16:9 media panel, LIVE badge top-left, mono viewer
 * count bottom-left over a dark overlay, avatar + title/meta row.
 * The last captured frame serves as the poster for offline channels;
 * the fallback is the mock's tonal panel with a display monogram.
 */
export function StreamCard({ channel }: { channel: DiscoverChannel }) {
  const [thumbFailed, setThumbFailed] = useState(false);
  const c = channel;

  return (
    <Link
      href={`/channel/${c.slug}`}
      className="group block overflow-hidden rounded-lg border border-border bg-card outline-none transition-[translate,box-shadow,border-color] duration-120 ease-[var(--ease-micro)] hover:-translate-y-0.5 hover:border-primary/40 hover:shadow-[0_4px_12px_rgba(0,0,0,0.5)] focus-visible:outline-2 focus-visible:outline-ring"
    >
      {/* 16:9 media panel — mock anatomy */}
      <div className="relative aspect-video w-full overflow-hidden border-b border-border bg-[#171b22]">
        {!thumbFailed ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={thumbUrl(c.community_id)}
            alt=""
            loading="lazy"
            onError={() => setThumbFailed(true)}
            className="h-full w-full object-cover transition-[filter] duration-120 group-hover:brightness-105"
          />
        ) : (
          <div className="flex h-full w-full items-center justify-center" aria-hidden="true">
            <span className="font-display text-4xl font-bold text-muted-foreground/25">
              {c.name.slice(0, 2).toUpperCase()}
            </span>
          </div>
        )}

        <div className="absolute left-2 top-2">
          {c.is_live ? (
            <LiveBadge />
          ) : (
            <span className="rounded-xs bg-black/60 px-1.5 py-0.5 text-[11px] font-bold uppercase tracking-wide text-white/80">
              Offline
            </span>
          )}
        </div>

        {c.is_live && (
          <span className="absolute bottom-2 left-2 inline-flex items-center gap-1 rounded-xs bg-black/60 px-1.5 py-0.5 text-xs text-white">
            <Eye className="h-3 w-3" aria-hidden="true" />
            <span className="font-num">{c.viewers}</span>
          </span>
        )}
      </div>

      {/* Meta row — avatar 36, title 14/600, meta 13 muted */}
      <div className="flex items-start gap-2.5 p-2.5">
        <span
          className={cn(
            "flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-sm font-bold",
            c.is_live ? "bg-primary text-primary-foreground" : "bg-secondary text-muted-foreground",
          )}
          aria-hidden="true"
        >
          {c.name.slice(0, 1).toUpperCase()}
        </span>
        <span className="min-w-0 flex-1">
          <span className="block truncate text-sm font-semibold text-foreground">{c.name}</span>
          <span className="block truncate text-[13px] text-muted-foreground">
            {c.stream_title || c.description || `@${c.slug}`}
          </span>
        </span>
      </div>
    </Link>
  );
}
