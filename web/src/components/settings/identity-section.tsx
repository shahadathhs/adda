"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { setIdentityMode } from "@/lib/api";
import { sessionKeys } from "@/lib/session";
import type { IdentityMode, User } from "@/lib/types";
import { cn } from "@/lib/cn";

const OPTIONS: { mode: IdentityMode; label: string }[] = [
  { mode: "named", label: "Show my name" },
  { mode: "anonymous", label: "Appear as Anonymous" },
];

/** Choose how you appear in chat, with a preview of what viewers will see. */
export function IdentitySection({ user }: { user: User }) {
  const qc = useQueryClient();
  const change = useMutation({
    mutationFn: setIdentityMode,
    onSuccess: (next) => {
      qc.setQueryData(sessionKeys.me, next);
      toast.success(
        next.identity_mode === "anonymous" ? "Chatting anonymously" : "Chatting as you",
      );
    },
    onError: (e) => toast.error(e instanceof Error ? e.message : "Could not save"),
  });

  return (
    <section aria-labelledby="identity-heading">
      <h2
        id="identity-heading"
        className="mb-3 font-display text-xl font-semibold tracking-tight text-foreground"
      >
        How you appear in chat
      </h2>
      <div className="space-y-4 rounded-md border border-border bg-card p-5">
        <div
          role="radiogroup"
          aria-labelledby="identity-heading"
          className="inline-flex rounded-md border border-border bg-background p-0.5"
        >
          {OPTIONS.map((o) => {
            const on = user.identity_mode === o.mode;
            return (
              <button
                key={o.mode}
                type="button"
                role="radio"
                aria-checked={on}
                disabled={change.isPending}
                onClick={() => !on && change.mutate(o.mode)}
                className={cn(
                  "rounded-sm px-3 py-1.5 text-[13px] font-medium outline-none transition-colors duration-120 focus-visible:outline-2 focus-visible:outline-ring",
                  on
                    ? "bg-secondary text-foreground"
                    : "text-muted-foreground hover:text-foreground",
                )}
              >
                {o.label}
              </button>
            );
          })}
        </div>
        <p className="max-w-xl text-[13px] leading-5 text-muted-foreground">
          Anonymous hides your name from other viewers. Your messages are still recorded against
          your account, and the channel owner, its moderators and the server admin can see who is
          behind them.
        </p>

        <div className="border-t border-border pt-4">
          <p className="mb-3 text-[11px] font-semibold uppercase tracking-[0.08em] text-muted-foreground">
            Preview
          </p>
          <div className="grid gap-3 sm:grid-cols-2">
            <Preview label="Show my name" author={user.username} accent />
            <Preview label="Anonymous" author="Anonymous" />
          </div>
        </div>
      </div>
    </section>
  );
}

function Preview({ label, author, accent }: { label: string; author: string; accent?: boolean }) {
  return (
    <div className="rounded-md border border-border bg-background p-3">
      <p className="mb-2 text-xs text-muted-foreground">{label}</p>
      <p className="text-[13px] text-foreground">
        <span className={cn("font-semibold", accent ? "text-primary" : "text-muted-foreground")}>
          {author}
        </span>
        : thanks both, rewinding now
      </p>
    </div>
  );
}
