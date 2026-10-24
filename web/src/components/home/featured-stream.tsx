import Link from "next/link";
import { Radio } from "lucide-react";
import type { DiscoverChannel } from "@/lib/types";
import { Button } from "@/components/ui/button";
import { LiveBadge, UserAvatar } from "@/components/ui/primitives";
import { Elapsed } from "@/components/elapsed";
import { FollowButton } from "@/components/home/follow-button";
import { StreamThumb } from "@/components/stream-thumb";
import { ViewerCount } from "@/components/viewer-count";

/** The one dominant element on home: the busiest live channel, or a quiet empty state. */
export function FeaturedStream({ channel: c }: { channel: DiscoverChannel | undefined }) {
  if (!c) {
    return (
      <section
        aria-label="Nobody is live"
        className="flex min-h-[260px] flex-col items-center justify-center gap-3 rounded-lg border border-border bg-card px-6 py-12 text-center"
      >
        <Radio className="h-6 w-6 text-muted-foreground/60" aria-hidden="true" />
        <h1 className="font-display text-2xl font-bold tracking-tight text-foreground">
          Nobody is live right now
        </h1>
        <p className="max-w-md text-sm text-muted-foreground">
          Follow a channel to get a bell the moment it goes on air. Recordings of past broadcasts
          are below.
        </p>
      </section>
    );
  }

  return (
    <section
      aria-label="Featured stream"
      className="grid items-stretch gap-6 lg:grid-cols-[minmax(0,1.7fr)_minmax(0,1fr)]"
    >
      <Link
        href={`/channel/${c.slug}`}
        className="group block overflow-hidden rounded-lg border border-border bg-card outline-none focus-visible:outline-2 focus-visible:outline-ring"
      >
        <div className="relative">
          <StreamThumb communityId={c.community_id} name={c.name} className="aspect-[16/8.2]" />
          <div className="absolute left-2 top-2">
            <LiveBadge />
          </div>
          <div className="absolute bottom-2 left-2">
            <ViewerCount viewers={c.viewers} />
          </div>
          {c.started_at && (
            <span className="absolute bottom-2 right-2 rounded-xs bg-black/60 px-1.5 py-px text-xs text-white">
              <Elapsed since={c.started_at} />
            </span>
          )}
        </div>
      </Link>

      <div className="flex flex-col justify-between gap-6 py-1">
        <div>
          <p className="text-[11px] font-semibold uppercase tracking-[0.08em] text-live">
            On air now
          </p>
          <h1 className="mt-2 font-display text-[28px] font-bold leading-8 tracking-tight text-foreground">
            {c.stream_title || c.name}
          </h1>
          {c.description && (
            <p className="mt-3 line-clamp-3 max-w-[380px] text-sm text-muted-foreground">
              {c.description}
            </p>
          )}
          <div className="mt-5 flex items-center gap-2.5">
            <UserAvatar name={c.name} src={c.avatar_url} className="h-9 w-9 text-[13px]" />
            <div>
              <p className="text-sm font-semibold text-foreground">{c.name}</p>
              <p className="text-[13px] text-muted-foreground">
                <span className="font-num">{c.follower_count.toLocaleString()}</span> followers
              </p>
            </div>
          </div>
        </div>
        <div className="flex gap-2">
          <Link href={`/channel/${c.slug}`}>
            <Button variant="primary">Watch now</Button>
          </Link>
          <FollowButton communityId={c.community_id} />
        </div>
      </div>
    </section>
  );
}
