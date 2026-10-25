import { Play } from "lucide-react";
import type { Community } from "@/lib/types";
import { Button } from "@/components/ui/button";
import { FollowButton } from "@/components/home/follow-button";

const ago = (iso: string) => {
  const days = Math.floor((Date.now() - new Date(iso).getTime()) / 86_400_000);
  if (days < 1) return "today";
  return days === 1 ? "yesterday" : `${days} days ago`;
};

/** What the player area shows when the channel is not broadcasting. */
export function OfflinePanel({
  community,
  lastStreamedAt,
  onWatchLast,
}: {
  community: Community;
  lastStreamedAt: string | null;
  onWatchLast: () => void;
}) {
  return (
    <section
      aria-label="Channel is offline"
      className="flex aspect-video w-full flex-col items-center justify-center gap-3 rounded-lg border border-border bg-card px-6 text-center"
    >
      <span className="rounded-xs bg-secondary px-1.5 py-px text-[11px] font-bold uppercase tracking-wide text-muted-foreground">
        Offline
      </span>
      <h1 className="font-display text-[28px] font-bold leading-8 tracking-tight text-foreground">
        {community.name} is offline
      </h1>
      <p className="text-sm text-muted-foreground">
        {lastStreamedAt ? `Last streamed ${ago(lastStreamedAt)}` : "No broadcasts yet"}
      </p>
      <div className="flex flex-wrap justify-center gap-2">
        <FollowButton communityId={community.id} solid />
        {lastStreamedAt && (
          <Button variant="outline" onClick={onWatchLast}>
            <Play className="h-3.5 w-3.5" aria-hidden="true" /> Watch the last stream
          </Button>
        )}
      </div>
    </section>
  );
}
