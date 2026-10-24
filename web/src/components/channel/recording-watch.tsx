"use client";

import { useState } from "react";
import Link from "next/link";
import type { Community } from "@/lib/types";
import { useRecordings } from "@/lib/data";
import { recordingFileUrl, recordingTitle } from "@/lib/recordings";
import { DownloadRecording } from "@/components/recording-actions";
import { StreamThumb } from "@/components/stream-thumb";
import { UserAvatar } from "@/components/ui/primitives";

const fmtDate = (iso: string) =>
  new Date(iso).toLocaleDateString([], { month: "long", day: "numeric", year: "numeric" });

/** Recording playback: the video, its title and channel, a download link, and more from this channel. */
export function RecordingWatch({ community, path }: { community: Community; path: string }) {
  const { data: recs, isPending } = useRecordings(community.id, true);
  const [failed, setFailed] = useState(false);
  const current = recs?.find((r) => r.path === path);
  const name = current?.name ?? path.split("/").pop() ?? "recording";
  const others = (recs ?? []).filter((r) => r.path !== path).slice(0, 6);

  return (
    <div className="mx-auto max-w-[1100px] space-y-5 px-4 py-5 sm:px-6">
      <div className="overflow-hidden rounded-lg border border-border bg-black">
        <video
          key={path}
          controls
          autoPlay
          playsInline
          onError={() => setFailed(true)}
          className="aspect-video w-full"
          src={recordingFileUrl(path)}
        />
      </div>
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
  );
}
