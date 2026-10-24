"use client";

import Link from "next/link";
import { useDiscover } from "@/lib/data";
import { LiveBadge, UserAvatar } from "@/components/ui/primitives";
import { StreamThumb } from "@/components/stream-thumb";
import { ViewerCount } from "@/components/viewer-count";

/** The busiest live channel on this server, shown beside the forms. Nothing if nobody is live. */
export function AuthPreview() {
  const { data } = useDiscover();
  const c = data?.filter((d) => d.is_live).sort((a, b) => b.viewers - a.viewers)[0];
  if (!c) return null;

  return (
    <Link
      href={`/channel/${c.slug}`}
      className="group mb-7 block max-w-[420px] overflow-hidden rounded-lg border border-border bg-background outline-none focus-visible:outline-2 focus-visible:outline-ring"
    >
      <div className="relative border-b border-border">
        <StreamThumb communityId={c.community_id} name={c.name} />
        <div className="absolute left-2 top-2">
          <LiveBadge />
        </div>
        <div className="absolute bottom-2 left-2">
          <ViewerCount viewers={c.viewers} />
        </div>
      </div>
      <div className="flex gap-2.5 px-3 py-2.5">
        <UserAvatar name={c.name} src={c.avatar_url} className="h-9 w-9 text-[13px]" />
        <div className="min-w-0">
          <p className="truncate text-sm font-semibold text-foreground">
            {c.stream_title || c.name}
          </p>
          <p className="truncate text-[13px] text-muted-foreground">{c.name}</p>
        </div>
      </div>
    </Link>
  );
}
