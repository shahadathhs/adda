"use client";

import { BarChart3 } from "lucide-react";
import type { Poll } from "@/lib/types";
import { mmss, useCountdown } from "@/lib/use-countdown";
import { cn } from "@/lib/cn";

/**
 * The channel's poll. While it is open and you have not voted, options are buttons; otherwise
 * they show the live result. Guests see the result but cannot vote.
 */
export function PollCard({
  poll,
  canVote,
  onVote,
}: {
  poll: Poll;
  canVote: boolean;
  onVote: (optionId: string) => void;
}) {
  const left = useCountdown(poll.status === "open" ? poll.closes_at : null);
  const open = poll.status === "open" && (left === null || left > 0);
  const choosing = open && canVote && !poll.my_vote;

  return (
    <section
      aria-label="Poll"
      className="mx-3 mb-2 rounded-md border border-border bg-card px-3 py-2.5"
    >
      <h3 className="flex items-center gap-1.5 text-[13px] font-semibold text-foreground">
        <BarChart3 className="h-3.5 w-3.5 text-primary" aria-hidden="true" />
        {poll.question}
      </h3>
      <ul className="mt-2 space-y-1.5">
        {poll.options.map((o) => {
          const picked = poll.my_vote === o.id;
          const body = (
            <>
              <span
                aria-hidden="true"
                className={cn(
                  "absolute inset-0 origin-left rounded-sm transition-transform duration-250 ease-[var(--ease-spring)]",
                  picked ? "bg-primary/30" : "bg-secondary",
                )}
                style={{ transform: `scaleX(${choosing ? 0 : o.percent / 100})` }}
              />
              <span className="relative flex items-center justify-between gap-2">
                <span className="truncate">{o.label}</span>
                {!choosing && <span className="font-num text-xs">{o.percent}%</span>}
              </span>
            </>
          );
          const cls = cn(
            "relative block w-full overflow-hidden rounded-sm border px-2.5 py-1.5 text-left text-[13px]",
            picked ? "border-primary text-foreground" : "border-border text-foreground",
          );
          return (
            <li key={o.id}>
              {choosing ? (
                <button
                  type="button"
                  onClick={() => onVote(o.id)}
                  className={cn(
                    cls,
                    "outline-none hover:border-muted-foreground/60 focus-visible:outline-2 focus-visible:outline-ring",
                  )}
                >
                  {body}
                </button>
              ) : (
                <div className={cls}>{body}</div>
              )}
            </li>
          );
        })}
      </ul>
      <p className="mt-2 text-xs text-muted-foreground">
        <span className="font-num">{poll.total}</span> vote{poll.total === 1 ? "" : "s"} ·{" "}
        {open ? (
          <>
            closes in <span className="font-num">{left === null ? "--:--" : mmss(left)}</span>
          </>
        ) : (
          "final result"
        )}
        {open && !canVote && " · sign in to vote"}
      </p>
    </section>
  );
}
