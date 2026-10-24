"use client";

import Link from "next/link";
import { Eye } from "lucide-react";
import type { DiscoverChannel } from "@/lib/types";
import { thumbUrl } from "@/lib/data";
import { Button } from "@/components/ui/button";
import { LiveBadge } from "@/components/ui/primitives";

/**
 * The hero — always present, content-adaptive:
 * someone live → featured broadcast (their frame is the poster);
 * nobody live → the brand statement with the live-pulse motif.
 */
export function HomeHero({ live }: { live: DiscoverChannel[] }) {
  const featured = live.length > 0 ? live.reduce((a, b) => (b.viewers > a.viewers ? b : a)) : null;

  if (featured) {
    return (
      <section
        aria-label="Featured live channel"
        className="overflow-hidden rounded-lg border border-border"
      >
        <div className="relative aspect-[21/9] max-h-[420px] w-full bg-[#171b22] sm:aspect-[21/8]">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={thumbUrl(featured.community_id)}
            alt=""
            className="h-full w-full object-cover"
          />
          <div className="absolute inset-x-0 bottom-0 flex flex-wrap items-center gap-4 bg-black/70 p-4 sm:p-5">
            <div className="min-w-0 flex-1">
              <div className="flex flex-wrap items-center gap-2.5">
                <LiveBadge />
                <span className="inline-flex items-center gap-1 text-xs text-white/80">
                  <Eye className="h-3.5 w-3.5" aria-hidden="true" />
                  <span className="font-num">{featured.viewers}</span> watching
                </span>
              </div>
              <h2 className="mt-1.5 truncate font-display text-xl font-bold tracking-tight text-white sm:text-2xl">
                {featured.stream_title || featured.name}
              </h2>
              <p className="truncate text-sm text-white/70">{featured.name}</p>
            </div>
            <Link href={`/channel/${featured.slug}`}>
              <Button variant="primary" size="lg">
                Watch now
              </Button>
            </Link>
          </div>
        </div>
      </section>
    );
  }

  return (
    <section
      aria-label="Welcome"
      className="flex flex-col items-center gap-4 rounded-lg border border-border bg-card/40 px-6 py-16 text-center sm:py-20"
    >
      <span className="live-dot" aria-hidden="true" />
      <h2 className="max-w-2xl font-display text-3xl font-bold tracking-tight text-foreground sm:text-4xl">
        Your community&apos;s live home
      </h2>
      <p className="max-w-md text-sm text-muted-foreground sm:text-base">
        Channels, chat, live streams, and recordings — all on this instance. Create a channel and go
        live in minutes.
      </p>
      <div className="mt-2 flex flex-wrap justify-center gap-3">
        <Link href="/studio">
          <Button variant="primary" size="lg">
            Create a channel
          </Button>
        </Link>
        <Link href="/channels">
          <Button variant="outline" size="lg">
            Explore channels
          </Button>
        </Link>
      </div>
    </section>
  );
}
