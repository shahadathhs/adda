"use client";

import { useChannelVideos } from "@/lib/use-videos";
import { CardGrid } from "@/components/browse/card-grid";
import { VideoCard } from "@/components/video-card";

/** A channel's uploaded videos, newest first. */
export function VideosSection({ communityId }: { communityId: string }) {
  const { data, isPending, isError } = useChannelVideos(communityId);
  const ready = (data ?? []).filter((v) => v.status === "ready" && v.visibility === "public");

  if (isPending) return <p className="text-sm text-muted-foreground">Loading videos…</p>;
  if (isError) return <p className="text-sm text-destructive">Could not load the videos.</p>;
  if (!ready.length)
    return (
      <p className="text-sm text-muted-foreground">
        No videos yet. Uploads from the channel owner appear here.
      </p>
    );
  return (
    <CardGrid>
      {ready.map((v) => (
        <VideoCard key={v.id} video={v} showChannel={false} />
      ))}
    </CardGrid>
  );
}
