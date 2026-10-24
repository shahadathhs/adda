"use client";

import { useEffect, useRef, useState } from "react";
import { Send } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useCommunityChat } from "@/lib/data";
import { useMe } from "@/lib/session";
import { cn } from "@/lib/cn";

// Chat name colors — per-user, deterministic, on-brand (DESIGN.md chart
// family; violet is banned everywhere).
const NAME_COLORS = ["#5aa9e6", "#4cc38a", "#d67ab1", "#f5a623", "#e0a33e"];

const nameColor = (userId: string) => {
  let hash = 0;
  for (let i = 0; i < userId.length; i++) hash = (hash * 31 + userId.charCodeAt(i)) | 0;
  return NAME_COLORS[Math.abs(hash) % NAME_COLORS.length];
};

const time = (iso: string) =>
  new Date(iso).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });

export function ChatRail({ communityId }: { communityId: string }) {
  const { messages, online, send } = useCommunityChat(communityId);
  const [draft, setDraft] = useState("");
  const bottomRef = useRef<HTMLDivElement>(null);
  const { data: user } = useMe();

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth", block: "end" });
  }, [messages.length]);

  return (
    <section
      aria-label="Chat"
      className="flex h-[480px] flex-col overflow-hidden rounded-md border border-border bg-card lg:h-[calc(100vh-8rem)] lg:min-h-[480px]"
    >
      <header className="flex h-10 shrink-0 items-center justify-between border-b border-border px-3">
        <span className="text-[13px] font-semibold text-foreground">Chat</span>
        <span className="inline-flex items-center gap-1.5 text-xs text-muted-foreground">
          <span className="h-1.5 w-1.5 rounded-full bg-ok" aria-hidden="true" />
          <span className="font-num">{online}</span> here
        </span>
      </header>

      <div className="flex-1 space-y-1.5 overflow-y-auto px-3 py-2.5">
        {messages.length === 0 && (
          <p className="py-8 text-center text-xs text-muted-foreground">
            No messages yet — say hi.
          </p>
        )}
        {messages.map((m) => (
          <p key={m.id} className="text-[13px] leading-[1.4] break-words">
            <time className="mr-1 font-num text-[11px] text-muted-foreground/60">
              {time(m.created_at)}
            </time>
            <span className="font-semibold" style={{ color: nameColor(m.user_id) }}>
              {m.display_name}
            </span>
            <span className="text-muted-foreground">: </span>
            <span
              className={cn(
                "text-foreground/90",
                m.user_id === user?.id && "bg-primary-subtle text-foreground",
              )}
            >
              {m.content}
            </span>
          </p>
        ))}
        <div ref={bottomRef} />
      </div>

      {user ? (
        <form
          className="flex shrink-0 gap-2 border-t border-border p-2"
          onSubmit={(e) => {
            e.preventDefault();
            if (draft.trim()) {
              send(draft.trim());
              setDraft("");
            }
          }}
        >
          <Input
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            placeholder="Send a message…"
            className="h-8"
            aria-label="Chat message"
            maxLength={500}
          />
          <Button type="submit" size="sm" variant="primary" disabled={!draft.trim()}>
            <Send className="h-3.5 w-3.5" aria-hidden="true" />
            <span className="sr-only">Send</span>
          </Button>
        </form>
      ) : (
        <p className="shrink-0 border-t border-border p-2.5 text-center text-xs text-muted-foreground">
          Sign in to join the conversation.
        </p>
      )}
    </section>
  );
}
