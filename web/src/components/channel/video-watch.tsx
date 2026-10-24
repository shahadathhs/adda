"use client";

import { useState } from "react";
import Link from "next/link";
import type { Community } from "@/lib/types";
import { ApiError } from "@/lib/api";
import { formatBytes, formatDuration } from "@/lib/format";
import { useVideo, useChannelVideos, videoMediaUrl } from "@/lib/use-videos";
import { VideoCard } from "@/components/video-card";
import { UserAvatar } from "@/components/ui/primitives";

const fmtDate = (iso: string) =>
  new Date(iso).toLocaleDateString([], { month: "long", day: "numeric", year: "numeric" });

/** Video playback: the player, title and channel, the description, and more from this channel. */
export function VideoWatch({ community, videoId }: { community: Community; videoId: string }) {
  const { data: video, isPending, error } = useVideo(videoId);
  const { data: all } = useChannelVideos(community.id);
  const [failed, setFailed] = useState(false);

  if (isPending) return <p className="p-10 text-center text-sm text-muted-foreground">Loading…</p>;
  if (error || !video || video.community_id !== community.id) {
    const missing = error instanceof ApiError ? error.status === 404 : true;
    return (
      <div className="mx-auto max-w-md px-4 py-20 text-center">
        <h1 className="font-display text-2xl font-bold text-foreground">
          {missing ? "This video is not available" : "Could not load the video"}
        </h1>
        <p className="mt-2 text-sm text-muted-foreground">
          It may have been removed, or it is private to the channel owner.
        </p>
        <Link
          href={`/channel/${community.slug}`}
          className="mt-4 inline-block text-sm text-primary hover:underline"
        >
          Back to {community.name}
        </Link>
      </div>
    );
  }

  const src = videoMediaUrl(video, "file");
  const others = (all ?? [])
    .filter((v) => v.id !== video.id && v.status === "ready" && v.visibility === "public")
    .slice(0, 6);

  return (
    <div className="grid gap-6 px-4 py-5 sm:px-6 lg:grid-cols-[minmax(0,1fr)_340px]">
      <div className="min-w-0 space-y-5">
        <div className="overflow-hidden rounded-lg border border-border bg-black">
          {video.status === "ready" && src && !failed ? (
            <video
              key={video.id}
              controls
              playsInline
              preload="metadata"
              poster={videoMediaUrl(video, "poster") ?? undefined}
              onError={() => setFailed(true)}
              className="aspect-video w-full"
              src={src}
            />
          ) : (
            <div className="grid aspect-video place-items-center px-6 text-center text-sm text-muted-foreground">
              {failed
                ? "Your browser could not play this file."
                : video.status === "failed"
                  ? (video.error ?? "This video could not be prepared.")
                  : "This video is still being prepared. It will appear here shortly."}
            </div>
          )}
        </div>

        <div>
          <h1 className="font-display text-2xl font-bold leading-8 tracking-tight text-foreground">
            {video.title}
          </h1>
          <div className="mt-3 flex items-center gap-3">
            <UserAvatar
              name={community.name}
              src={community.avatar_url}
              className="h-10 w-10 text-sm"
            />
            <div className="min-w-0">
              <Link
                href={`/channel/${community.slug}`}
                className="block truncate text-sm font-semibold text-foreground hover:underline"
              >
                {community.name}
              </Link>
              <p className="text-[13px] text-muted-foreground">
                {fmtDate(video.created_at)}
                {video.duration_seconds != null && (
                  <>
                    {" · "}
                    <span className="font-num">{formatDuration(video.duration_seconds)}</span>
                  </>
                )}
                {video.width && video.height ? (
                  <>
                    {" · "}
                    <span className="font-num">{video.height}p</span>
                  </>
                ) : null}
                {" · "}
                <span className="font-num">{formatBytes(video.size_bytes)}</span>
                {video.visibility !== "public" && ` · ${video.visibility}`}
              </p>
            </div>
          </div>
          {video.description && (
            <p className="mt-4 max-w-2xl whitespace-pre-line text-sm leading-relaxed text-muted-foreground">
              {video.description}
            </p>
          )}
        </div>
      </div>

      <aside aria-label="More videos" className="space-y-3">
        <h2 className="font-display text-base font-semibold text-foreground">
          More from {community.name}
        </h2>
        {others.length === 0 ? (
          <p className="text-sm text-muted-foreground">No other videos yet.</p>
        ) : (
          others.map((v) => <VideoCard key={v.id} video={v} showChannel={false} />)
        )}
      </aside>
    </div>
  );
}
