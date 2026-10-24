"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Send } from "lucide-react";
import { setIdentityMode } from "@/lib/api";
import { sessionKeys, useMe } from "@/lib/session";
import type { ChatMessage } from "@/lib/types";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/cn";

const MAX = 300;

// Chat name colours: per user, stable, from the chart family (violet is banned).
const NAME_COLORS = ["#5aa9e6", "#4cc38a", "#d67ab1", "#f5a623", "#e0a33e"];
const ANONYMOUS_COLOR = "#9aa1af";

const nameColor = (userId: string | null) => {
  if (!userId) return ANONYMOUS_COLOR;
  let hash = 0;
  for (let i = 0; i < userId.length; i++) hash = (hash * 31 + userId.charCodeAt(i)) | 0;
  return NAME_COLORS[Math.abs(hash) % NAME_COLORS.length];
};

const BADGE: Record<string, { label: string; cls: string }> = {
  owner: { label: "Owner", cls: "bg-primary-subtle text-primary" },
  moderator: { label: "Mod", cls: "bg-ok/15 text-ok" },
  follower: { label: "Follower", cls: "bg-secondary text-muted-foreground" },
};

const ERROR_COPY: Record<string, string> = {
  auth_required: "Sign in to chat.",
  too_long: `Messages are limited to ${MAX} characters.`,
  empty: "Write something first.",
};

/** The chat column: messages, with the composer (or a sign-in prompt) at the foot. */
export function ChatPanel({
  name,
  messages,
  online,
  connected,
  loaded,
  error,
  clearError,
  send,
}: {
  name: string;
  messages: ChatMessage[];
  online: number;
  connected: boolean;
  loaded: boolean;
  error: { code: string; message: string } | null;
  clearError: () => void;
  send: (content: string) => void;
}) {
  const { data: user } = useMe();
  const qc = useQueryClient();
  const [draft, setDraft] = useState("");
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ block: "end" });
  }, [messages.length]);

  const toggleIdentity = useMutation({
    mutationFn: () => setIdentityMode(user?.identity_mode === "anonymous" ? "named" : "anonymous"),
    onSuccess: (next) => qc.setQueryData(sessionKeys.me, next),
  });
  const anonymous = user?.identity_mode === "anonymous";

  return (
    <section aria-label="Chat" className="flex h-[520px] flex-col lg:h-full">
      <header className="flex h-12 shrink-0 items-center justify-between px-5">
        <h2 className="text-sm font-semibold text-foreground">Chat</h2>
        <span className="text-xs text-muted-foreground">
          {connected ? (
            <>
              <span className="font-num">{online.toLocaleString()}</span> here
            </>
          ) : (
            "Reconnecting…"
          )}
        </span>
      </header>

      <div className="min-h-0 flex-1 space-y-2.5 overflow-y-auto px-5 py-2" aria-live="polite">
        {!loaded && messages.length === 0 && (
          <p className="py-8 text-center text-xs text-muted-foreground" role="status">
            Loading chat…
          </p>
        )}
        {loaded && messages.length === 0 && (
          <p className="py-8 text-center text-xs text-muted-foreground">
            No messages yet. {user ? "Say hi." : "Sign in to say hi."}
          </p>
        )}
        {messages.map((m) => (
          <p key={m.id} className="break-words text-[13px] leading-[1.45] text-foreground">
            {m.author.badges
              .filter((b) => BADGE[b])
              .map((b) => (
                <span
                  key={b}
                  className={cn(
                    "mr-1 inline-block rounded-xs px-1.5 align-baseline text-[10px] font-semibold uppercase leading-[14px] tracking-[0.03em]",
                    BADGE[b].cls,
                  )}
                >
                  {BADGE[b].label}
                </span>
              ))}
            <span className="font-semibold" style={{ color: nameColor(m.author.id) }}>
              {m.author.display_name}
            </span>
            : {m.content}
          </p>
        ))}
        <div ref={bottomRef} />
      </div>

      {error && (
        <p role="alert" className="shrink-0 px-5 pb-1 text-xs text-destructive">
          {ERROR_COPY[error.code] ?? error.message}
        </p>
      )}

      {user ? (
        <form
          className="shrink-0 p-3"
          onSubmit={(e) => {
            e.preventDefault();
            const text = draft.trim();
            if (!text || !connected) return;
            send(text);
            setDraft("");
          }}
        >
          <div className="flex items-center gap-2 rounded-md border border-input bg-input/50 pl-3 pr-1.5 focus-within:outline-2 focus-within:outline-ring">
            <input
              value={draft}
              onChange={(e) => {
                setDraft(e.target.value);
                if (error) clearError();
              }}
              placeholder={
                connected ? `Say something to ${name}…` : "Reconnecting… your draft is kept"
              }
              aria-label="Chat message"
              maxLength={MAX}
              className="h-9 min-w-0 flex-1 bg-transparent text-sm text-foreground outline-none placeholder:text-muted-foreground"
            />
            <button
              type="submit"
              disabled={!draft.trim() || !connected}
              aria-label="Send"
              className="grid h-7 w-7 place-items-center rounded-sm text-primary transition-colors duration-120 hover:bg-secondary disabled:text-muted-foreground/50"
            >
              <Send className="h-4 w-4" aria-hidden="true" />
            </button>
          </div>
          <div className="mt-2 flex items-center justify-between px-1 text-xs text-muted-foreground">
            <span>
              Chatting as{" "}
              <span className="font-semibold text-foreground">
                {anonymous ? "Anonymous" : user.username}
              </span>
              {" · "}
              <button
                type="button"
                disabled={toggleIdentity.isPending}
                onClick={() => toggleIdentity.mutate()}
                className="text-primary hover:underline"
              >
                {anonymous ? "switch to my name" : "switch to anonymous"}
              </button>
            </span>
            <span className="font-num">
              {draft.length}/{MAX}
            </span>
          </div>
        </form>
      ) : (
        <div className="shrink-0 space-y-2.5 border-t border-border p-4">
          <p className="text-[13px] text-muted-foreground">
            You are watching as a guest. Sign in to chat, react and follow.
          </p>
          <div className="flex gap-2">
            <Link href="/login">
              <Button variant="primary">Sign in</Button>
            </Link>
            <Link href="/register">
              <Button variant="outline">Create account</Button>
            </Link>
          </div>
        </div>
      )}
    </section>
  );
}
