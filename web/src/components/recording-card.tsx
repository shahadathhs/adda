"use client";

import Link from "next/link";
import type { RecordingFeedItem } from "@/lib/types";
import { UserAvatar } from "@/components/ui/primitives";
import { recordingTitle } from "@/lib/recordings";
import { StreamThumb } from "@/components/stream-thumb";

/** VOD card: the channel's frame, a Recording tag, title, channel and date. */
export function RecordingCard({ recording: r }: { recording: RecordingFeedItem }) {
  return (
    <Link
      href={`/channel/${r.community_slug}`}
      className="group block overflow-hidden rounded-lg border border-border bg-card outline-none transition-[translate,border-color] duration-120 ease-[var(--ease-micro)] hover:-translate-y-0.5 hover:border-muted-foreground/40 focus-visible:outline-2 focus-visible:outline-ring"
    >
      <div className="relative border-b border-border">
        <StreamThumb communityId={r.community_id} name={r.community_name} />
        <span className="absolute left-2 top-2 rounded-xs bg-black/60 px-1.5 py-px text-[11px] font-bold uppercase tracking-wide text-white/80">
          Recording
        </span>
      </div>
      <div className="flex gap-2.5 px-3 pb-3 pt-2.5">
        <UserAvatar name={r.community_name} className="h-9 w-9 text-[13px]" />
        <div className="min-w-0">
          <p className="truncate text-sm font-semibold text-foreground">{recordingTitle(r.name)}</p>
          <p className="truncate text-[13px] text-muted-foreground">
            {r.community_name} ·{" "}
            {new Date(r.created_at).toLocaleDateString([], { month: "short", day: "numeric" })}
          </p>
        </div>
      </div>
    </Link>
  );
}
