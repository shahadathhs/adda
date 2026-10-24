import type { RecordingComment } from "@/lib/types";
import { clock } from "@/lib/clock";

/** Ticks under the player showing where comments sit; pressing one seeks there. */
export function CommentMarkers({
  comments,
  duration,
  onSeek,
}: {
  comments: RecordingComment[];
  duration: number;
  onSeek: (seconds: number) => void;
}) {
  if (!duration || comments.length === 0) return null;
  return (
    <div className="relative h-4" aria-label="Comment markers">
      <div className="absolute inset-x-0 top-1/2 h-px bg-border" aria-hidden="true" />
      {comments.map((c) => (
        <button
          key={c.id}
          type="button"
          title={`${clock(c.at_seconds)} · ${c.body}`}
          aria-label={`Comment at ${clock(c.at_seconds)}`}
          onClick={() => onSeek(c.at_seconds)}
          className="absolute top-0 h-4 w-2 -translate-x-1/2 focus-visible:outline-2 focus-visible:outline-ring"
          style={{ left: `${Math.min(100, (c.at_seconds / duration) * 100)}%` }}
        >
          <span className="mx-auto block h-3 w-0.5 rounded-full bg-primary" />
        </button>
      ))}
    </div>
  );
}
