"use client";

import { useRef, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import Link from "next/link";
import type { Community } from "@/lib/types";
import { useRecordings } from "@/lib/data";
import { recordingFileUrl, recordingTitle } from "@/lib/recordings";
import { recordingComments } from "@/lib/api";
import { DeleteRecordingButton } from "@/components/channel/delete-recording-button";
import { useChannelRole } from "@/lib/use-channel-role";
import { CommentMarkers } from "@/components/channel/comment-markers";
import { RecordingComments } from "@/components/channel/recording-comments";
import { DownloadRecording } from "@/components/recording-actions";
import { StreamThumb } from "@/components/stream-thumb";
import { UserAvatar } from "@/components/ui/primitives";

const fmtDate = (iso: string) =>
  new Date(iso).toLocaleDateString([], { month: "long", day: "numeric", year: "numeric" });

/** Recording playback: the video, its title and channel, a download link, and more from this channel. */
export function RecordingWatch({ community, path }: { community: Community; path: string }) {
  const { data: recs, isPending } = useRecordings(community.id, true);
  const [failed, setFailed] = useState(false);
  const role = useChannelRole(community.id);
  const video = useRef<HTMLVideoElement>(null);
  const [position, setPosition] = useState(0);
  const [duration, setDuration] = useState(0);
  const { data: markers } = useQuery({
    queryKey: ["recording-comments", community.id, path, "time"],
    queryFn: () => recordingComments(community.id, path, "time"),
  });
  const seek = (seconds: number) => {
    if (video.current) {
      video.current.currentTime = seconds;
      void video.current.play().catch(() => undefined);
    }
  };
  const current = recs?.find((r) => r.path === path);
  const name = current?.name ?? path.split("/").pop() ?? "recording";
  const others = (recs ?? []).filter((r) => r.path !== path).slice(0, 6);

  return (
    <div className="mx-auto grid max-w-[1400px] gap-6 px-4 py-5 sm:px-6 lg:grid-cols-[minmax(0,1fr)_340px]">
      <div className="min-w-0 space-y-5">
        <div className="overflow-hidden rounded-lg border border-border bg-black">
          <video
            key={path}
            ref={video}
            controls
            autoPlay
            playsInline
            onTimeUpdate={(e) => setPosition(e.currentTarget.currentTime)}
            onLoadedMetadata={(e) => setDuration(e.currentTarget.duration)}
            onError={() => setFailed(true)}
            className="aspect-video w-full"
            src={recordingFileUrl(path)}
          />
        </div>
        <CommentMarkers comments={markers ?? []} duration={duration} onSeek={seek} />
        {failed && (
          <p role="alert" className="text-sm text-destructive">
            This recording could not be played. It may still be saving, or it was removed.
          </p>
        )}

        <div className="flex flex-wrap items-center gap-3.5">
          <UserAvatar
            name={community.name}
            src={community.avatar_url}
            className="h-12 w-12 text-base"
          />
          <div className="min-w-0 flex-1">
            <h1 className="font-display text-xl font-semibold leading-7 tracking-tight text-foreground">
              {recordingTitle(name)}
            </h1>
            <p className="text-[13px] text-muted-foreground">
              <Link
                href={`/channel/${community.slug}`}
                className="font-semibold text-foreground hover:underline"
              >
                {community.name}
              </Link>
              {current && (
                <>
                  {" · recorded "}
                  {fmtDate(current.created_at)}
                  {" · "}
                  <span className="font-num">{(current.size_bytes / 1e9).toFixed(2)}</span> GB
                </>
              )}
            </p>
          </div>
          <DownloadRecording path={path} name={name} />
          {role === "owner" && (
            <DeleteRecordingButton communityId={community.id} path={path} slug={community.slug} />
          )}
        </div>

        {!isPending && !current && (
          <p className="text-sm text-muted-foreground">
            This recording is not in the channel&apos;s list. It may have been removed.
          </p>
        )}

        {others.length > 0 && (
          <section aria-labelledby="more-recordings" className="pt-3">
            <h2
              id="more-recordings"
              className="mb-3.5 font-display text-xl font-semibold tracking-tight text-foreground"
            >
              More from {community.name}
            </h2>
            <ul className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {others.map((r) => (
                <li key={r.path}>
                  <Link
                    href={`/channel/${community.slug}/recording?path=${encodeURIComponent(r.path)}`}
                    className="group block overflow-hidden rounded-lg border border-border bg-card outline-none transition-[border-color] duration-120 hover:border-muted-foreground/40 focus-visible:outline-2 focus-visible:outline-ring"
                  >
                    <div className="relative border-b border-border">
                      <StreamThumb communityId={community.id} name={community.name} />
                      <span className="absolute left-2 top-2 rounded-xs bg-black/60 px-1.5 py-px text-[11px] font-bold uppercase tracking-wide text-white/80">
                        Recording
                      </span>
                    </div>
                    <p className="truncate px-3 py-2.5 text-sm font-semibold text-foreground">
                      {recordingTitle(r.name)}
                    </p>
                  </Link>
                </li>
              ))}
            </ul>
          </section>
        )}
      </div>
      <aside className="lg:sticky lg:top-16 lg:self-start">
        <RecordingComments
          communityId={community.id}
          path={path}
          position={position}
          onSeek={seek}
        />
      </aside>
    </div>
  );
}
