"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { setIdentityMode } from "@/lib/api";
import { sessionKeys } from "@/lib/session";
import type { IdentityMode, User } from "@/lib/types";
import { Card } from "@/components/ui/card";
import { cn } from "@/lib/cn";

const OPTIONS: { mode: IdentityMode; title: string; body: string }[] = [
  {
    mode: "named",
    title: "Use my name",
    body: "Your display name and badges show next to messages.",
  },
  {
    mode: "anonymous",
    title: "Anonymous",
    body: "Viewers see “Anonymous”. Channel moderators can still see who sent a message.",
  },
];

export function IdentityCard({ user }: { user: User }) {
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
    <Card className="space-y-3 p-4">
      <div>
        <h2 className="font-display font-bold tracking-tight">Chat identity</h2>
        <p className="text-xs text-muted-foreground">
          Applies to messages you send from now on. Earlier messages keep how they were sent.
        </p>
      </div>
      <div role="radiogroup" aria-label="Chat identity" className="grid gap-2 sm:grid-cols-2">
        {OPTIONS.map((o) => {
          const active = user.identity_mode === o.mode;
          return (
            <button
              key={o.mode}
              type="button"
              role="radio"
              aria-checked={active}
              disabled={change.isPending}
              onClick={() => !active && change.mutate(o.mode)}
              className={cn(
                "rounded-md border p-3 text-left transition-colors duration-120 outline-none focus-visible:outline-2 focus-visible:outline-ring",
                active
                  ? "border-primary bg-primary-subtle"
                  : "border-border hover:border-muted-foreground/50",
              )}
            >
              <span className="block text-sm font-semibold text-foreground">{o.title}</span>
              <span className="mt-0.5 block text-xs text-muted-foreground">{o.body}</span>
            </button>
          );
        })}
      </div>
    </Card>
  );
}
