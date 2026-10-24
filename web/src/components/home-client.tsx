"use client";

import { useSearchParams } from "next/navigation";
import type { DiscoverChannel, RecordingFeedItem } from "@/lib/types";
import { useLiveGrid } from "@/lib/data";
import { FeaturedStream } from "@/components/home/featured-stream";
import { FollowingView } from "@/components/home/following-view";
import { FollowingStrip } from "@/components/home/following-strip";
import { MobileHomeTabs } from "@/components/home/mobile-home-tabs";
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

  const channels = useLiveGrid(initial);
  const live = channels.filter((c) => c.is_live).sort((a, b) => b.viewers - a.viewers);
  const offline = channels.filter((c) => !c.is_live);

  return (
    <div className="flex">
      <HomeRail channels={channels} recordings={recordings} />
      <div className="min-w-0 flex-1 space-y-8 px-4 py-6 sm:px-6">
        <MobileHomeTabs />
        {!following && <FollowingStrip channels={channels} />}
        {following ? (
          <FollowingView channels={channels} />
        ) : (
          <>
            <FeaturedStream channel={live[0]} />

            <HomeSection
              title="Live now"
              count={live.length}
              hint="Sorted by viewers"
              empty="No channel is live right now."
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
              empty="No other channels on this instance yet."
            >
              <div className={GRID}>
                {offline.map((c) => (
                  <StreamCard key={c.community_id} channel={c} />
                ))}
              </div>
            </HomeSection>

            <HomeSection
              title="Recent recordings"
              count={recordings.length}
              hint="Newest first"
              empty="Recordings appear here after a broadcast ends."
            >
              <div className={GRID}>
                {recordings.map((r) => (
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
