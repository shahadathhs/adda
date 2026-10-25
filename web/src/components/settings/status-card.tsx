"use client";

import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { clearStatus, setStatus } from "@/lib/api";
import { sessionKeys } from "@/lib/session";
import { STATUS_EMOJI, STATUS_EXPIRY, STATUS_TEXT_MAX } from "@/lib/status";
import type { StatusExpiry, User } from "@/lib/types";
import { Button } from "@/components/ui/button";
import { Field } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/cn";

/** A short status under your name: an emoji, a few words and when it ends. */
export function StatusCard({ user }: { user: User }) {
  const qc = useQueryClient();
  const [emoji, setEmoji] = useState<string | null>(user.status?.emoji ?? null);
  const [text, setText] = useState(user.status?.text ?? "");
  const [expires, setExpires] = useState<StatusExpiry>("never");
  const saved = (next: User) => qc.setQueryData(sessionKeys.me, next);

  const save = useMutation({
    mutationFn: () => setStatus({ emoji, text: text.trim(), expires }),
    onSuccess: (next) => {
      saved(next);
      toast.success("Status saved");
    },
    onError: (e) => toast.error(e instanceof Error ? e.message : "Could not save the status"),
  });
  const clear = useMutation({
    mutationFn: clearStatus,
    onSuccess: (next) => {
      saved(next);
      setEmoji(null);
      setText("");
      setExpires("never");
      toast.success("Status cleared");
    },
  });

  const empty = !emoji && !text.trim();

  return (
    <section aria-labelledby="status-heading">
      <h2
        id="status-heading"
        className="mb-3 font-display text-xl font-semibold tracking-tight text-foreground"
      >
        Status
      </h2>
      <form
        className="space-y-4 rounded-md border border-border bg-card p-5"
        onSubmit={(e) => {
          e.preventDefault();
          save.mutate();
        }}
      >
        <Field
          label="What's happening?"
          htmlFor="status-text"
          help={
            <span className="font-num">
              {text.length}/{STATUS_TEXT_MAX}
            </span>
          }
        >
          <Input
            id="status-text"
            maxLength={STATUS_TEXT_MAX}
            placeholder="Back at 6, streaming the radio build"
            value={text}
            onChange={(e) => setText(e.target.value)}
          />
        </Field>

        <div role="group" aria-label="Status emoji" className="flex flex-wrap gap-1.5">
          {STATUS_EMOJI.map((e) => (
            <button
              key={e}
              type="button"
              aria-pressed={emoji === e}
              aria-label={`Use ${e}`}
              onClick={() => setEmoji(emoji === e ? null : e)}
              className={cn(
                "h-9 w-9 cursor-pointer rounded-sm border text-base outline-none transition-colors duration-120 focus-visible:outline-2 focus-visible:outline-ring",
                emoji === e
                  ? "border-primary bg-secondary"
                  : "border-border bg-background hover:bg-secondary",
              )}
            >
              {e}
            </button>
          ))}
        </div>

        <Field label="Clear status" htmlFor="status-expires">
          <select
            id="status-expires"
            value={expires}
            onChange={(e) => setExpires(e.target.value as StatusExpiry)}
            className="h-9 w-full rounded-sm border border-input bg-input/50 px-2 text-sm text-foreground"
          >
            {STATUS_EXPIRY.map((o) => (
              <option key={o.value} value={o.value}>
                {o.label}
              </option>
            ))}
          </select>
        </Field>

        <div className="flex justify-end gap-2">
          {user.status && (
            <Button
              type="button"
              variant="ghost"
              disabled={clear.isPending}
              onClick={() => clear.mutate()}
            >
              Clear status
            </Button>
          )}
          <Button variant="primary" type="submit" disabled={empty || save.isPending}>
            {save.isPending ? "Saving…" : "Set status"}
          </Button>
        </div>
      </form>
    </section>
  );
}
