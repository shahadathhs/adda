"use client";

import Link from "next/link";
import { Film } from "lucide-react";
import type { Video } from "@/lib/types";
import { UserAvatar } from "@/components/ui/primitives";
import { formatDuration } from "@/lib/format";
import { videoMediaUrl } from "@/lib/use-videos";

/** An uploaded video: its poster with the length, the title, the channel and the date. */
export function VideoCard({
  video: v,
  showChannel = true,
}: {
  video: Video;
  showChannel?: boolean;
}) {
  const poster = videoMediaUrl(v, "poster");
  return (
    <Link
      href={`/channel/${v.community_slug}/video/${v.id}`}
      className="group block overflow-hidden rounded-lg border border-border bg-card outline-none transition-[translate,border-color] duration-120 ease-[var(--ease-micro)] hover:-translate-y-0.5 hover:border-muted-foreground/40 focus-visible:outline-2 focus-visible:outline-ring"
    >
      <div className="relative aspect-video overflow-hidden border-b border-border bg-background">
        {poster ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={poster} alt="" loading="lazy" className="h-full w-full object-cover" />
        ) : (
          <div
            className="grid h-full w-full place-items-center text-muted-foreground/30"
            aria-hidden="true"
          >
            <Film className="h-8 w-8" />
          </div>
        )}
        {v.duration_seconds != null && (
          <span className="absolute bottom-2 right-2 rounded-xs bg-black/70 px-1.5 py-px font-num text-[11px] font-medium text-white">
            {formatDuration(v.duration_seconds)}
          </span>
        )}
      </div>
      <div className="flex gap-2.5 px-3 pb-3 pt-2.5">
        {showChannel && <UserAvatar name={v.community_name} className="h-9 w-9 text-[13px]" />}
        <div className="min-w-0">
          <p className="truncate text-sm font-semibold text-foreground">{v.title}</p>
          <p className="truncate text-[13px] text-muted-foreground">
            {showChannel && `${v.community_name} · `}
            {new Date(v.created_at).toLocaleDateString([], { month: "short", day: "numeric" })}
          </p>
        </div>
      </div>
    </Link>
  );
}
