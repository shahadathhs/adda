"use client";

import { useState } from "react";
import Link from "next/link";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { addRecordingComment, deleteRecordingComment, recordingComments } from "@/lib/api";
import { useMe } from "@/lib/session";
import { canModerate, useChannelRole } from "@/lib/use-channel-role";
import { clock } from "@/lib/clock";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/cn";

/** Timestamped comments on a recording: read by anyone, written by accounts at the current time. */
export function RecordingComments({
  communityId,
  path,
  position,
  onSeek,
}: {
  communityId: string;
  path: string;
  /** The player's current time, in seconds. */
  position: number;
  onSeek: (seconds: number) => void;
}) {
  const qc = useQueryClient();
  const { data: user } = useMe();
  const role = useChannelRole(communityId);
  const [sort, setSort] = useState<"time" | "recent">("time");
  const [draft, setDraft] = useState("");
  const key = ["recording-comments", communityId, path] as const;
  const { data: comments, isPending } = useQuery({
    queryKey: [...key, sort],
    queryFn: () => recordingComments(communityId, path, sort),
  });
  const refresh = () => void qc.invalidateQueries({ queryKey: key });

  const add = useMutation({
    mutationFn: () => addRecordingComment(communityId, path, position, draft.trim()),
    onSuccess: () => {
      setDraft("");
      refresh();
    },
    onError: (e) => toast.error(e instanceof Error ? e.message : "Could not post the comment"),
  });
  const remove = useMutation({
    mutationFn: (id: string) => deleteRecordingComment(id),
    onSuccess: refresh,
  });

  return (
    <section aria-label="Comments" className="flex flex-col">
      <header className="flex items-center justify-between pb-3">
        <h2 className="text-sm font-semibold text-foreground">
          Comments
          {comments && (
            <span className="ml-2 font-num text-xs text-muted-foreground">{comments.length}</span>
          )}
        </h2>
        <div
          role="radiogroup"
          aria-label="Sort comments"
          className="inline-flex rounded-md border border-border bg-card p-0.5"
        >
          {(["time", "recent"] as const).map((s) => (
            <button
              key={s}
              type="button"
              role="radio"
              aria-checked={sort === s}
              onClick={() => setSort(s)}
              className={cn(
                "rounded-sm px-2.5 py-1 text-xs font-medium capitalize outline-none focus-visible:outline-2 focus-visible:outline-ring",
                sort === s ? "bg-secondary text-foreground" : "text-muted-foreground",
              )}
            >
              {s === "time" ? "By time" : "Newest"}
            </button>
          ))}
        </div>
      </header>

      <div className="max-h-[420px] min-h-24 space-y-3 overflow-y-auto pr-1">
        {isPending ? (
          <p className="text-sm text-muted-foreground" role="status">
            Loading comments…
          </p>
        ) : !comments?.length ? (
          <p className="text-sm text-muted-foreground">
            No comments yet.{" "}
            {user ? "Add one at the moment you are watching." : "Sign in to add one."}
          </p>
        ) : (
          comments.map((c) => {
            const own = !!user && c.author.id === user.id;
            return (
              <article key={c.id} className="text-[13px] leading-5">
                <p className="flex items-baseline justify-between gap-2">
                  <span className="min-w-0 truncate">
                    <button
                      type="button"
                      onClick={() => onSeek(c.at_seconds)}
                      aria-label={`Jump to ${clock(c.at_seconds)}`}
                      className="mr-1.5 rounded-xs bg-primary-subtle px-1.5 font-num text-xs text-primary hover:underline focus-visible:outline-2 focus-visible:outline-ring"
                    >
                      {clock(c.at_seconds)}
                    </button>
                    <span className={cn("font-semibold text-foreground", !c.author.id && "italic")}>
                      {c.author.display_name}
                    </span>
                  </span>
                  {(own || canModerate(role)) && (
                    <button
                      type="button"
                      onClick={() => remove.mutate(c.id)}
                      className="shrink-0 text-xs text-muted-foreground hover:text-destructive focus-visible:outline-2 focus-visible:outline-ring"
                    >
                      Delete<span className="sr-only"> comment</span>
                    </button>
                  )}
                </p>
                <p className="break-words text-foreground">{c.body}</p>
              </article>
            );
          })
        )}
      </div>

      {user ? (
        <form
          className="mt-3 space-y-2 border-t border-border pt-3"
          onSubmit={(e) => {
            e.preventDefault();
            if (draft.trim()) add.mutate();
          }}
        >
          <label htmlFor="rec-comment" className="sr-only">
            Comment at {clock(position)}
          </label>
          <textarea
            id="rec-comment"
            rows={2}
            maxLength={300}
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            placeholder={`Comment at ${clock(position)}…`}
            className="w-full rounded-sm border border-input bg-input/50 px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus-visible:outline-2 focus-visible:outline-ring"
          />
          <div className="flex items-center justify-between">
            <span className="font-num text-xs text-muted-foreground">{draft.length}/300</span>
            <Button type="submit" variant="primary" disabled={!draft.trim() || add.isPending}>
              Comment
            </Button>
          </div>
        </form>
      ) : (
        <p className="mt-3 border-t border-border pt-3 text-[13px] text-muted-foreground">
          <Link href="/login" className="text-primary hover:underline">
            Sign in
          </Link>{" "}
          to comment.
        </p>
      )}
    </section>
  );
}
