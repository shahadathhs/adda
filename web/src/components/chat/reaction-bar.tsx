"use client";

import { cn } from "@/lib/cn";

/** The reaction chips under a message. Pressing one toggles your own. */
export function ReactionBar({
  reactions,
  mine,
  canReact,
  onToggle,
}: {
  reactions: Record<string, number>;
  mine: string[];
  canReact: boolean;
  onToggle: (emoji: string, on: boolean) => void;
}) {
  const entries = Object.entries(reactions).filter(([, n]) => n > 0);
  if (entries.length === 0) return null;
  return (
    <div className="mt-1 flex flex-wrap gap-1">
      {entries.map(([emoji, count]) => {
        const on = mine.includes(emoji);
        return (
          <button
            key={emoji}
            type="button"
            disabled={!canReact}
            aria-pressed={on}
            aria-label={`${emoji} ${count}`}
            onClick={() => onToggle(emoji, !on)}
            className={cn(
              "inline-flex items-center gap-1 rounded-sm border px-1.5 py-px text-xs outline-none transition-colors duration-120 focus-visible:outline-2 focus-visible:outline-ring",
              on
                ? "border-primary/60 bg-primary-subtle text-foreground"
                : "border-border bg-secondary text-muted-foreground",
              canReact && !on && "hover:border-muted-foreground/50",
            )}
          >
            <span aria-hidden="true">{emoji}</span>
            <span className="font-num">{count}</span>
          </button>
        );
      })}
    </div>
  );
}
