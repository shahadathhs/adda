"use client";

import { useRef, useState } from "react";
import Link from "next/link";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Film } from "lucide-react";
import { toast } from "sonner";
import { deleteVideo } from "@/lib/api";
import type { Video } from "@/lib/types";
import type { VideoUpload } from "@/lib/use-video-upload";
import { formatBytes, formatDuration } from "@/lib/format";
import { videoKeys, videoMediaUrl } from "@/lib/use-videos";
import { Button } from "@/components/ui/button";
import { VideoEditForm } from "@/components/studio/video-edit-form";
import { cn } from "@/lib/cn";

const chip = "rounded-xs px-1.5 py-px text-[11px] font-semibold uppercase tracking-wide";

function Status({ video, active }: { video: Video; active: boolean }) {
  if (video.status === "ready")
    return (
      <span className={cn(chip, "bg-secondary text-muted-foreground")}>{video.visibility}</span>
    );
  if (video.status === "processing")
    return <span className={cn(chip, "bg-secondary text-foreground")}>Preparing…</span>;
  if (video.status === "failed")
    return <span className={cn(chip, "bg-destructive/20 text-destructive")}>Failed</span>;
  const pct = Math.round((video.received_bytes / video.size_bytes) * 100);
  return (
    <span className={cn(chip, "bg-secondary text-foreground")}>
      {active ? "Uploading" : `Paused at ${pct}%`}
    </span>
  );
}

/** One of the channel's videos with its state and what you can do with it. */
export function VideoRow({ video, upload }: { video: Video; upload: VideoUpload }) {
  const qc = useQueryClient();
  const [editing, setEditing] = useState(false);
  const pick = useRef<HTMLInputElement>(null);
  const active = upload.state.phase === "uploading" && upload.state.video.id === video.id;
  const poster = videoMediaUrl(video, "poster");

  const remove = useMutation({
    mutationFn: () => deleteVideo(video.id),
    onSuccess: () => {
      toast.success("Video deleted");
      void qc.invalidateQueries({ queryKey: videoKeys.channel(video.community_id) });
    },
    onError: (e) => toast.error(e instanceof Error ? e.message : "Could not delete the video"),
  });

  return (
    <li className="rounded-md border border-border bg-card">
      <div className="flex gap-4 p-3">
        <div className="relative grid aspect-video w-36 shrink-0 place-items-center overflow-hidden rounded-sm border border-border bg-background">
          {poster ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={poster} alt="" className="h-full w-full object-cover" />
          ) : (
            <Film className="h-5 w-5 text-muted-foreground/40" aria-hidden="true" />
          )}
        </div>
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            {video.status === "ready" ? (
              <Link
                href={`/channel/${video.community_slug}/video/${video.id}`}
                className="truncate text-sm font-semibold text-foreground hover:underline"
              >
                {video.title}
              </Link>
            ) : (
              <span className="truncate text-sm font-semibold text-foreground">{video.title}</span>
            )}
            <Status video={video} active={active} />
          </div>
          <p className="mt-1 text-[13px] text-muted-foreground">
            {new Date(video.created_at).toLocaleDateString([], {
              month: "short",
              day: "numeric",
              year: "numeric",
            })}
            {video.duration_seconds != null && (
              <>
                {" · "}
                <span className="font-num">{formatDuration(video.duration_seconds)}</span>
              </>
            )}
            {" · "}
            <span className="font-num">{formatBytes(video.size_bytes)}</span>
          </p>
          {video.status === "failed" && video.error && (
            <p role="alert" className="mt-1 text-[13px] text-destructive">
              {video.error}
            </p>
          )}
          <div className="mt-2 flex flex-wrap gap-2">
            {video.status === "uploading" && !active && (
              <>
                <input
                  ref={pick}
                  type="file"
                  accept=".mp4,.m4v,.mov,.webm"
                  className="sr-only"
                  aria-label={`Choose the file to continue uploading ${video.title}`}
                  onChange={(e) => {
                    const f = e.target.files?.[0];
                    if (f) void upload.resume(video, f);
                    e.target.value = "";
                  }}
                />
                <Button size="sm" variant="outline" onClick={() => pick.current?.click()}>
                  Continue: choose the same file
                </Button>
              </>
            )}
            {video.status !== "uploading" && (
              <Button
                size="sm"
                variant="outline"
                onClick={() => setEditing((v) => !v)}
                aria-expanded={editing}
              >
                Edit
              </Button>
            )}
            <Button
              size="sm"
              variant="ghost"
              disabled={remove.isPending || active}
              onClick={() => {
                if (window.confirm(`Delete “${video.title}”? This cannot be undone.`))
                  remove.mutate();
              }}
            >
              Delete
            </Button>
          </div>
        </div>
      </div>
      {editing && <VideoEditForm video={video} onDone={() => setEditing(false)} />}
    </li>
  );
}
