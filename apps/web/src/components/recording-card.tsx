"use client";

import Link from "next/link";
import type { RecordingFeedItem } from "@adda/types";
import { thumbUrl } from "@/lib/data";

/** VOD card — poster (the channel's stream frame), title, channel, date. */
export function RecordingCard({ recording: r }: { recording: RecordingFeedItem }) {
  const [prefix, suffix] = r.name.includes("-")
    ? [r.name.slice(0, r.name.lastIndexOf("-")), r.name.lastIndexOf(".")]
    : [r.name, r.name.lastIndexOf(".")];
  void suffix;
  const title =
    prefix
      .replace(/^\d{4}-\d{2}-\d{2}T?/, "")
      .replace(/[-_]+/g, " ")
      .trim() || r.name;

  return (
    <Link
      href={`/channel/${r.community_slug}`}
      className="group block overflow-hidden rounded-lg border border-border bg-card outline-none transition-[translate,box-shadow] duration-120 ease-[var(--ease-micro)] hover:-translate-y-0.5 hover:shadow-[0_4px_12px_rgba(0,0,0,0.5)] focus-visible:outline-2 focus-visible:outline-ring"
    >
      <div className="relative aspect-video w-full overflow-hidden bg-[#171b22]">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={thumbUrl(r.community_id)}
          alt=""
          loading="lazy"
          className="h-full w-full object-cover transition-[filter] duration-120 group-hover:brightness-110"
        />
        <span className="absolute bottom-2 left-2 rounded-xs bg-black/60 px-1.5 py-0.5 text-[11px] text-white/90">
          VOD
        </span>
      </div>
      <div className="p-2.5">
        <p className="truncate text-sm font-semibold text-foreground">{title}</p>
        <p className="truncate text-[13px] text-muted-foreground">
          {r.community_name} ·{" "}
          {new Date(r.created_at).toLocaleDateString([], { month: "short", day: "numeric" })}
        </p>
      </div>
    </Link>
  );
}
