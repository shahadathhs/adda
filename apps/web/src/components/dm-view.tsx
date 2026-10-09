"use client";

import { useEffect, useRef, useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { ArrowLeft, Ban, Send } from "lucide-react";
import { toast } from "sonner";
import {
  blockUser,
  listBlocked,
  listDmMessages,
  listDmThreads,
  markDmRead,
  openDmThread,
  resolveDmPeer,
  sendDmMessage,
  unblockUser,
} from "@adda/api-client";
import type { DmMessage, DmPeer, DmThread } from "@adda/types";
import { socket } from "@adda/api-client";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { UserAvatar } from "@/components/ui/primitives";
import { cn } from "@/lib/cn";

const time = (iso: string) =>
  new Date(iso).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
const day = (iso: string) => new Date(iso).toLocaleDateString();

function InboxRow({
  thread,
  active,
  onOpen,
}: {
  thread: DmThread;
  active: boolean;
  onOpen: () => void;
}) {
  return (
    <button
      onClick={onOpen}
      className={cn(
        "flex w-full items-center gap-3 rounded-sm p-2.5 text-left outline-none transition-colors duration-120",
        active
          ? "bg-primary-subtle"
          : "hover:bg-secondary focus-visible:outline-2 focus-visible:outline-ring",
      )}
    >
      <UserAvatar
        name={thread.peer.display_name}
        src={thread.peer.avatar_url}
        className="h-9 w-9 text-xs"
      />
      <span className="min-w-0 flex-1">
        <span className="flex items-center justify-between gap-2">
          <span
            className={cn(
              "truncate text-sm",
              thread.unread_count > 0
                ? "font-bold text-foreground"
                : "font-medium text-foreground/90",
            )}
          >
            {thread.peer.display_name}
          </span>
          {thread.last_message && (
            <span className="font-num text-[11px] text-muted-foreground">
              {time(thread.last_message.created_at)}
            </span>
          )}
        </span>
        <span className="flex items-center justify-between gap-2">
          <span className="truncate text-xs text-muted-foreground">
            {thread.last_message?.content ?? "No messages yet"}
          </span>
          {thread.unread_count > 0 && (
            <span className="rounded-xs bg-primary px-1.5 text-[11px] font-bold text-primary-foreground">
              {thread.unread_count}
            </span>
          )}
        </span>
      </span>
    </button>
  );
}

function ThreadPane({ thread, onBack }: { thread: DmThread; onBack: () => void }) {
  const qc = useQueryClient();
  const [draft, setDraft] = useState("");
  const bottomRef = useRef<HTMLDivElement>(null);
  const [live, setLive] = useState<DmMessage[]>([]);
  const threadId = thread.id;

  const { data: history = [] } = useQuery({
    queryKey: ["dm-messages", threadId],
    queryFn: () => listDmMessages(threadId),
  });
  const { data: blocked = [] } = useQuery({
    queryKey: ["dm-blocked"],
    queryFn: listBlocked,
  });
  const isBlocked = blocked.some((b) => b.id === thread.peer.id);

  // Live updates for the open thread.
  useEffect(() => {
    socket.connect();
    const off = socket.on((msg) => {
      if (msg.type === "dm_message" && msg.data) {
        const d = msg.data as unknown as DmMessage;
        if (d.thread_id === threadId) setLive((prev) => [...prev, d]);
      }
    });
    return off;
  }, [threadId]);

  const messages = [...history, ...live.filter((l) => !history.some((h) => h.id === l.id))];

  // Mark read whenever the thread is open and messages arrive.
  useEffect(() => {
    const last = messages[messages.length - 1];
    if (last) void markDmRead(threadId, last.id);
    bottomRef.current?.scrollIntoView({ block: "end" });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [messages.length, threadId]);

  useEffect(() => {
    setLive([]);
  }, [threadId]);

  const send = async (e: React.FormEvent) => {
    e.preventDefault();
    const content = draft.trim();
    if (!content) return;
    setDraft("");
    try {
      const sent = await sendDmMessage(threadId, content);
      setLive((prev) => [...prev, sent]);
      void qc.invalidateQueries({ queryKey: ["dm-threads"] });
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Could not send");
    }
  };

  const toggleBlock = async () => {
    try {
      if (isBlocked) {
        await unblockUser(thread.peer.id);
        toast.success(`Unblocked ${thread.peer.display_name}`);
      } else {
        await blockUser(thread.peer.id);
        toast.success(`Blocked ${thread.peer.display_name}`);
      }
      void qc.invalidateQueries({ queryKey: ["dm-blocked"] });
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed");
    }
  };

  let lastDay = "";
  return (
    <div className="flex h-[calc(100vh-10rem)] min-h-[420px] flex-col rounded-md border border-border bg-card">
      <header className="flex h-12 shrink-0 items-center gap-3 border-b border-border px-3">
        <Button
          variant="ghost"
          size="sm"
          className="lg:hidden"
          onClick={onBack}
          aria-label="Back to inbox"
        >
          <ArrowLeft className="h-4 w-4" aria-hidden="true" />
        </Button>
        <UserAvatar
          name={thread.peer.display_name}
          src={thread.peer.avatar_url}
          className="h-8 w-8 text-xs"
        />
        <div className="min-w-0 flex-1">
          <p className="truncate text-sm font-semibold text-foreground">
            {thread.peer.display_name}
          </p>
          <p className="truncate text-xs text-muted-foreground">@{thread.peer.username}</p>
        </div>
        <Button
          variant="ghost"
          size="sm"
          title={isBlocked ? "Unblock" : "Block"}
          onClick={toggleBlock}
        >
          <Ban className={`h-4 w-4 ${isBlocked ? "text-live" : ""}`} aria-hidden="true" />
          <span className="sr-only">{isBlocked ? "Unblock" : "Block"}</span>
        </Button>
      </header>

      <div className="flex-1 space-y-1.5 overflow-y-auto px-3 py-3">
        {messages.length === 0 && (
          <p className="py-8 text-center text-xs text-muted-foreground">
            No messages yet — say hi.
          </p>
        )}
        {messages.map((m) => {
          const d = day(m.created_at);
          const showDay = d !== lastDay;
          lastDay = d;
          return (
            <div key={m.id}>
              {showDay && (
                <p className="my-2 text-center font-num text-[11px] text-muted-foreground/60">
                  {d}
                </p>
              )}
              <p
                className={cn(
                  "max-w-[85%] rounded-md px-2.5 py-1.5 text-[13px] leading-[1.4]",
                  m.sender_id === thread.peer.id
                    ? "bg-secondary text-foreground"
                    : "ml-auto bg-primary text-primary-foreground",
                )}
              >
                {m.content}
                <span
                  className={cn(
                    "ml-2 font-num text-[10px]",
                    m.sender_id === thread.peer.id
                      ? "text-muted-foreground"
                      : "text-primary-foreground/60",
                  )}
                >
                  {time(m.created_at)}
                </span>
              </p>
            </div>
          );
        })}
        <div ref={bottomRef} />
      </div>

      <form className="flex shrink-0 gap-2 border-t border-border p-2" onSubmit={send}>
        <Input
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          placeholder={isBlocked ? "You blocked this user" : "Write a message…"}
          disabled={isBlocked}
          maxLength={2000}
          aria-label="Message"
        />
        <Button type="submit" size="sm" variant="primary" disabled={!draft.trim() || isBlocked}>
          <Send className="h-3.5 w-3.5" aria-hidden="true" />
          <span className="sr-only">Send</span>
        </Button>
      </form>
    </div>
  );
}

export function DmView() {
  const qc = useQueryClient();
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [composer, setComposer] = useState("");
  const [opening, setOpening] = useState(false);

  const { data: threads = [] } = useQuery({
    queryKey: ["dm-threads"],
    queryFn: listDmThreads,
    refetchInterval: 30_000,
  });

  // Live inbox refresh.
  useEffect(() => {
    socket.connect();
    const off = socket.on((msg) => {
      if (msg.type === "dm_message" || msg.type === "dm_read") {
        void qc.invalidateQueries({ queryKey: ["dm-threads"] });
      }
    });
    return off;
  }, [qc]);

  const selected = threads.find((t) => t.id === selectedId) ?? null;

  const openByUsername = async (e: React.FormEvent) => {
    e.preventDefault();
    const username = composer.trim().replace(/^@/, "");
    if (!username) return;
    setOpening(true);
    try {
      const peer: DmPeer = await resolveDmPeer(username);
      const thread = await openDmThread(peer.id);
      await qc.invalidateQueries({ queryKey: ["dm-threads"] });
      setSelectedId(thread.id);
      setComposer("");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Could not start the conversation");
    } finally {
      setOpening(false);
    }
  };

  return (
    <div>
      <div className="grid gap-4 md:grid-cols-[280px_1fr]">
        <Card className="h-fit p-2">
          <form className="p-1 pb-2" onSubmit={openByUsername}>
            <Input
              value={composer}
              onChange={(e) => setComposer(e.target.value)}
              placeholder="@username"
              aria-label="Start a conversation with a username"
            />
            <Button
              type="submit"
              variant="primary"
              size="sm"
              className="mt-2 w-full"
              disabled={opening || !composer.trim()}
            >
              {opening ? "…" : "New message"}
            </Button>
          </form>
          <nav className="space-y-0.5" aria-label="Conversations">
            {threads.length === 0 && (
              <p className="p-3 text-center text-xs text-muted-foreground">No conversations yet.</p>
            )}
            {threads.map((t) => (
              <InboxRow
                key={t.id}
                thread={t}
                active={t.id === selectedId}
                onOpen={() => setSelectedId(t.id)}
              />
            ))}
          </nav>
        </Card>

        <div className="hidden md:block">
          {selected ? (
            <ThreadPane thread={selected} onBack={() => setSelectedId(null)} />
          ) : (
            <Card className="flex h-64 items-center justify-center text-sm text-muted-foreground">
              Select a conversation.
            </Card>
          )}
        </div>

        <div className="md:hidden">
          {selected && <ThreadPane thread={selected} onBack={() => setSelectedId(null)} />}
        </div>
      </div>
    </div>
  );
}
