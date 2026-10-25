import type { Community } from "@/lib/types";
import { FollowButton } from "@/components/home/follow-button";

const duration = (seconds: number) => {
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  return h > 0 ? `${h}h ${m}m` : `${Math.max(m, 1)}m`;
};

/** Shown where the player was when a broadcast you were watching ends. */
export function EndedPanel({
  community,
  seconds,
}: {
  community: Community;
  seconds: number | null;
}) {
  return (
    <section
      aria-label="Stream ended"
      className="flex aspect-video w-full flex-col items-center justify-center gap-3 rounded-lg border border-border bg-card px-6 text-center"
    >
      <span className="rounded-xs bg-secondary px-1.5 py-px text-[11px] font-bold uppercase tracking-wide text-muted-foreground">
        Stream ended
      </span>
      <h1 className="font-display text-[28px] font-bold leading-8 tracking-tight text-foreground">
        Thanks for watching
      </h1>
      <p className="text-sm text-muted-foreground">
        {community.name} streamed
        {seconds !== null && (
          <>
            {" for "}
            <span className="font-num">{duration(seconds)}</span>
          </>
        )}
        .
      </p>
      <p className="max-w-sm text-[13px] text-muted-foreground/80">
        The recording is being saved. It shows up under Recordings when it is ready.
      </p>
      <FollowButton communityId={community.id} solid />
    </section>
  );
}
