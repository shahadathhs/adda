"use client";

import { useCallback, useState, type ReactNode } from "react";
import { useRouter } from "next/navigation";
import { useQueryClient } from "@tanstack/react-query";
import { hlsBaseUrl } from "@/lib/config";
import type { Community } from "@/lib/types";
import { useStreamEnded } from "@/lib/use-stream-ended";
import { useRecordings, useStreamEvents, useStreamStatus, webKeys } from "@/lib/data";
import { ChatRail } from "@/components/chat-rail";
import { AboutPanel } from "@/components/channel/about-panel";
import { ChannelHeader } from "@/components/channel/channel-header";
import { FollowersList } from "@/components/channel/followers-list";
import { EndedPanel } from "@/components/channel/ended-panel";
import { OfflinePanel } from "@/components/channel/offline-panel";
import { LivePlayer } from "@/components/live-player";
import { VideosSection } from "@/components/channel/videos-section";
import { RecordingsSection } from "@/components/recordings-section";
import { useChannelVideos } from "@/lib/use-videos";
import { UnderlineTabs } from "@/components/ui/underline-tabs";

/**
 * The channel page: player (or the offline panel) with title and tabs on the
 * left; chat while live, the about column while offline, on the right.
 */
export function ChannelView({
  community,
  chat,
}: {
  community: Community;
  /** Replaces the live chat; used by the design previews. */
  chat?: ReactNode;
}) {
  const [tab, setTab] = useState("about");
  const qc = useQueryClient();
  const router = useRouter();
  const onChange = useCallback(() => {
    qc.invalidateQueries({ queryKey: webKeys.status(community.id) });
    qc.invalidateQueries({ queryKey: webKeys.detail(community.id) });
    qc.invalidateQueries({ queryKey: ["discover"] });
  }, [qc, community.id]);
  useStreamEvents(community.id, onChange);

  const { data: status } = useStreamStatus(community.id);
  const { data: recs } = useRecordings(community.id, true);
  const { data: vids } = useChannelVideos(community.id);
  const isLive = status?.is_live ?? community.is_live;
  const lastStreamedAt = recs?.[0]?.created_at ?? null;

  const ended = useStreamEnded(isLive, status?.started_at ?? null);

  return (
    <div className="grid grid-cols-[minmax(0,1fr)] lg:grid-cols-[minmax(0,1fr)_340px]">
      <div className="min-w-0 space-y-5 px-4 py-5 sm:px-6">
        {isLive ? (
          <LivePlayer
            hlsUrl={`${hlsBaseUrl()}/community/${community.id}/index.m3u8`}
            viewers={status?.viewers ?? 0}
          />
        ) : ended ? (
          <EndedPanel community={community} seconds={ended.seconds} />
        ) : (
          <OfflinePanel
            community={community}
            lastStreamedAt={lastStreamedAt}
            onWatchLast={() => {
              const latest = recs?.[0];
              if (latest)
                router.push(
                  `/channel/${community.slug}/recording?path=${encodeURIComponent(latest.path)}`,
                );
              else setTab("recordings");
            }}
          />
        )}

        <ChannelHeader
          community={community}
          isLive={isLive}
          startedAt={status?.started_at ?? null}
        />

        <UnderlineTabs
          label="Channel sections"
          active={tab}
          onChange={setTab}
          tabs={[
            { id: "about", label: "About" },
            { id: "recordings", label: "Recordings", count: recs?.length },
            {
              id: "videos",
              label: "Videos",
              count: vids?.filter((v) => v.status === "ready" && v.visibility === "public").length,
            },
            { id: "followers", label: "Followers", count: community.follower_count },
          ]}
        />

        <div role="tabpanel" id={`panel-${tab}`} aria-labelledby={`tab-${tab}`}>
          {tab === "about" && (
            <p className="max-w-2xl text-sm leading-relaxed text-muted-foreground">
              {community.description || "This channel has not written an about text yet."}
            </p>
          )}
          {tab === "recordings" && (
            <RecordingsSection
              communityId={community.id}
              communityName={community.name}
              communitySlug={community.slug}
            />
          )}
          {tab === "videos" && <VideosSection communityId={community.id} />}
          {tab === "followers" && <FollowersList communityId={community.id} />}
        </div>
      </div>

      <aside
        aria-label={isLive || ended ? "Chat" : "About this channel"}
        className="border-t border-border lg:sticky lg:top-14 lg:h-[calc(100vh-3.5rem)] lg:border-l lg:border-t-0"
      >
        {isLive || ended ? (
          (chat ?? <ChatRail communityId={community.id} name={community.name} ended={!isLive} />)
        ) : (
          <AboutPanel community={community} />
        )}
      </aside>
    </div>
  );
}
