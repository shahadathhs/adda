"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { chatState, listModActions, setChatSettings } from "@/lib/api";
import { cn } from "@/lib/cn";

const SLOW = [
  { value: 0, label: "Off" },
  { value: 5, label: "5 s" },
  { value: 30, label: "30 s" },
];

const VERB: Record<string, string> = {
  delete: "deleted a message by",
  timeout: "timed out",
  ban: "banned",
  lift: "lifted the restriction on",
  pin: "pinned a message",
  unpin: "unpinned the message",
  poll_start: "started a poll",
  poll_end: "ended the poll",
  chat_settings: "changed chat settings",
};

/** Slow mode and followers-only, plus the last few moderation actions. */
export function ChatModerationCard({ communityId }: { communityId: string }) {
  const qc = useQueryClient();
  const { data: state } = useQuery({
    queryKey: ["chat-state", communityId],
    queryFn: () => chatState(communityId),
  });
  const { data: actions } = useQuery({
    queryKey: ["mod-actions", communityId],
    queryFn: () => listModActions(communityId),
    refetchInterval: 10_000,
  });
  const save = useMutation({
    mutationFn: (data: Parameters<typeof setChatSettings>[1]) => setChatSettings(communityId, data),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: ["chat-state", communityId] });
      void qc.invalidateQueries({ queryKey: ["mod-actions", communityId] });
    },
    onError: (e) => toast.error(e instanceof Error ? e.message : "Could not save"),
  });
  const slow = state?.settings.slow_mode_seconds ?? 0;
  const followersOnly = state?.settings.followers_only ?? false;

  return (
    <section className="rounded-md border border-border bg-card p-4">
      <h2 className="text-[11px] font-semibold uppercase tracking-[0.08em] text-muted-foreground">
        Chat moderation
      </h2>
      <div className="mt-3 flex items-center justify-between gap-3">
        <span id="slow-label" className="text-sm text-foreground">
          Slow mode
        </span>
        <div
          role="radiogroup"
          aria-labelledby="slow-label"
          className="inline-flex rounded-md border border-border bg-background p-0.5"
        >
          {SLOW.map((o) => (
            <button
              key={o.value}
              type="button"
              role="radio"
              aria-checked={slow === o.value}
              disabled={save.isPending}
              onClick={() => slow !== o.value && save.mutate({ slow_mode_seconds: o.value })}
              className={cn(
                "rounded-sm px-2.5 py-1 text-xs font-medium outline-none focus-visible:outline-2 focus-visible:outline-ring",
                slow === o.value
                  ? "bg-secondary text-foreground"
                  : "text-muted-foreground hover:text-foreground",
              )}
            >
              {o.label}
            </button>
          ))}
        </div>
      </div>
      <div className="mt-3 flex items-center justify-between gap-3 border-b border-border pb-4">
        <span id="fo-label" className="text-sm text-foreground">
          Followers only
        </span>
        <button
          type="button"
          role="switch"
          aria-checked={followersOnly}
          aria-labelledby="fo-label"
          disabled={save.isPending}
          onClick={() => save.mutate({ followers_only: !followersOnly })}
          className={cn(
            "relative h-5 w-9 rounded-full transition-colors duration-120 focus-visible:outline-2 focus-visible:outline-ring",
            followersOnly ? "bg-primary" : "bg-secondary",
          )}
        >
          <span
            aria-hidden="true"
            className={cn(
              "absolute left-0.5 top-0.5 h-4 w-4 rounded-full bg-foreground transition-transform duration-120",
              followersOnly && "translate-x-4 bg-primary-foreground",
            )}
          />
        </button>
      </div>

      <h3 className="mt-4 text-[11px] font-semibold uppercase tracking-[0.08em] text-muted-foreground">
        Recent actions
      </h3>
      {!actions?.length ? (
        <p className="mt-2 text-[13px] text-muted-foreground">Nothing yet.</p>
      ) : (
        <ul className="mt-2 space-y-1.5 text-[13px]">
          {actions.slice(0, 5).map((a) => (
            <li key={a.id} className="text-muted-foreground">
              <span className="font-semibold text-foreground">{a.actor ?? "Someone"}</span>{" "}
              {VERB[a.action] ?? a.action}{" "}
              {a.target && <span className="text-foreground">{a.target}</span>}
              {a.action === "timeout" && a.detail && (
                <span className="ml-1.5 font-num text-xs">{a.detail}</span>
              )}
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
