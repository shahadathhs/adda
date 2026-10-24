"use client";

import { useSearchParams } from "next/navigation";
import type { DiscoverChannel, RecordingFeedItem } from "@/lib/types";
import { useLiveGrid } from "@/lib/data";
import { FeaturedStream } from "@/components/home/featured-stream";
import { FollowingView } from "@/components/home/following-view";
import { HomeRail } from "@/components/home/home-rail";
import { HomeSection } from "@/components/home-section";
import { RecordingCard } from "@/components/recording-card";
import { StreamCard } from "@/components/stream-card";

const GRID = "grid gap-4 sm:grid-cols-2 xl:grid-cols-4";

/** Home: following rail, the featured live channel, live now, channels, recordings. */
export function HomeClient({
  initial,
  recordings,
}: {
  initial: DiscoverChannel[];
  recordings: RecordingFeedItem[];
}) {
  const params = useSearchParams();
  const following = params.get("tab") === "following";
  const q = (params.get("q") ?? "").trim().toLowerCase();

  const channels = useLiveGrid(initial);
  const matches = (s: string | null | undefined) => !q || (s ?? "").toLowerCase().includes(q);
  const visible = channels.filter(
    (c) => matches(c.name) || matches(c.slug) || matches(c.stream_title) || matches(c.description),
  );
  const live = visible.filter((c) => c.is_live).sort((a, b) => b.viewers - a.viewers);
  const offline = visible.filter((c) => !c.is_live);
  const visibleRecs = recordings.filter(
    (r) => matches(r.community_name) || matches(r.community_slug) || matches(r.name),
  );

  return (
    <div className="flex">
      <HomeRail channels={channels} recordings={recordings} />
      <div className="min-w-0 flex-1 space-y-8 px-4 py-6 sm:px-6">
        {following ? (
          <FollowingView channels={channels} />
        ) : (
          <>
            {q && (
              <p className="text-sm text-muted-foreground">
                Showing results for <span className="font-semibold text-foreground">“{q}”</span>
              </p>
            )}
            <FeaturedStream channel={live[0]} />

            <HomeSection
              title="Live now"
              count={live.length}
              hint="Sorted by viewers"
              empty={q ? "No live channel matches your search." : "No channel is live right now."}
            >
              <div className={GRID}>
                {live.map((c) => (
                  <StreamCard key={c.community_id} channel={c} />
                ))}
              </div>
            </HomeSection>

            <HomeSection
              title="Channels"
              count={offline.length}
              hint="Offline right now"
              empty={
                q ? "No channel matches your search." : "No other channels on this instance yet."
              }
            >
              <div className={GRID}>
                {offline.map((c) => (
                  <StreamCard key={c.community_id} channel={c} />
                ))}
              </div>
            </HomeSection>

            <HomeSection
              title="Recent recordings"
              count={visibleRecs.length}
              hint="Newest first"
              empty="Recordings appear here after a broadcast ends."
            >
              <div className={GRID}>
                {visibleRecs.map((r) => (
                  <RecordingCard key={r.path} recording={r} />
                ))}
              </div>
            </HomeSection>
          </>
        )}
      </div>
    </div>
  );
}
