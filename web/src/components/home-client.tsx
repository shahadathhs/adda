"use client";

import { useSearchParams } from "next/navigation";
import type { DiscoverChannel, RecordingFeedItem } from "@/lib/types";
import { useLiveGrid } from "@/lib/data";
import { FeaturedStream } from "@/components/home/featured-stream";
import { FollowingView } from "@/components/home/following-view";
import { FollowingStrip } from "@/components/home/following-strip";
import { HomeHero } from "@/components/home/home-hero";
import { CardGrid } from "@/components/browse/card-grid";
import { Reveal } from "@/components/reveal";
import { HomeRail } from "@/components/home/home-rail";
import { HomeSection } from "@/components/home-section";
import { RecordingCard } from "@/components/recording-card";
import { StreamCard } from "@/components/stream-card";

const PREVIEW = 8; // cards per section; the rest live on the dedicated pages

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
        {!following && <FollowingStrip channels={channels} />}
        {following ? (
          <FollowingView channels={channels} />
        ) : (
          <>
            <HomeHero live={live.length} channels={channels.length} />
            <FeaturedStream channel={live[0]} />

            <Reveal>
              <HomeSection
                title="Live now"
                count={live.length}
                hint="Sorted by viewers"
                href="/live"
                empty="No channel is live right now."
              >
                <CardGrid>
                  {live.slice(0, PREVIEW).map((c) => (
                    <StreamCard key={c.community_id} channel={c} />
                  ))}
                </CardGrid>
              </HomeSection>
            </Reveal>

            <Reveal>
              <HomeSection
                title="Channels"
                count={offline.length}
                hint="Offline right now"
                href="/channels?status=offline"
                empty="No other channels on this instance yet."
              >
                <CardGrid>
                  {offline.slice(0, PREVIEW).map((c) => (
                    <StreamCard key={c.community_id} channel={c} />
                  ))}
                </CardGrid>
              </HomeSection>
            </Reveal>

            <Reveal>
              <HomeSection
                title="Recent recordings"
                count={recordings.length}
                hint="Newest first"
                href="/recordings"
                empty="Recordings appear here after a broadcast ends."
              >
                <CardGrid>
                  {recordings.slice(0, PREVIEW).map((r) => (
                    <RecordingCard key={r.path} recording={r} />
                  ))}
                </CardGrid>
              </HomeSection>
            </Reveal>
          </>
        )}
      </div>
    </div>
  );
}
