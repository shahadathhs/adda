"use client";

import { useStudioChannel } from "@/lib/studio";
import { useVideoUpload } from "@/lib/use-video-upload";
import { useChannelVideos } from "@/lib/use-videos";
import { VideoRow } from "@/components/studio/video-row";
import { VideoUploadCard } from "@/components/studio/video-upload-card";

export function VideosPage() {
  const { channel } = useStudioChannel();
  if (!channel) return null;
  return <VideosPanel communityId={channel.id} />;
}

function VideosPanel({ communityId }: { communityId: string }) {
  const upload = useVideoUpload(communityId);
  const { data, isPending, isError, refetch } = useChannelVideos(communityId);

  return (
    <div className="grid items-start gap-6 lg:grid-cols-[minmax(0,1fr)_380px]">
      <section aria-labelledby="videos-heading">
        <h2
          id="videos-heading"
          className="mb-3 font-display text-xl font-semibold tracking-tight text-foreground"
        >
          Your videos
          {data && (
            <span className="ml-2 font-num text-sm font-medium text-muted-foreground">
              {data.length}
            </span>
          )}
        </h2>
        {isPending ? (
          <p className="text-sm text-muted-foreground">Loading videos…</p>
        ) : isError ? (
          <p role="alert" className="text-sm text-destructive">
            Could not load your videos.{" "}
            <button className="underline" onClick={() => void refetch()}>
              Try again
            </button>
          </p>
        ) : data.length === 0 ? (
          <p className="rounded-md border border-border bg-card p-5 text-sm text-muted-foreground">
            Nothing uploaded yet. Videos you upload appear on your channel page, in the video
            directory and in search, unless you make them unlisted or private.
          </p>
        ) : (
          <ul className="space-y-3">
            {data.map((v) => (
              <VideoRow key={v.id} video={v} upload={upload} />
            ))}
          </ul>
        )}
      </section>
      <VideoUploadCard upload={upload} />
    </div>
  );
}
