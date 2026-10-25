"use client";

import { useEffect, useRef, useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { createBan, deleteChatMessage, pinMessage, revealAuthor, setIdentityMode } from "@/lib/api";
import { canModerate, useChannelRole } from "@/lib/use-channel-role";
import { useFollow } from "@/lib/data";
import { sessionKeys, useMe } from "@/lib/session";
import type { CommunityChat } from "@/lib/use-community-chat";
import type { ChatMessage } from "@/lib/types";
import { Composer } from "@/components/chat/composer";
import type { MenuItem } from "@/components/chat/message-menu";
import { MessageRow } from "@/components/chat/message-row";
import { PinnedBanner } from "@/components/chat/pinned-banner";
import { PollCard } from "@/components/chat/poll-card";

const ERROR_COPY: Record<string, string> = {
  auth_required: "Sign in to chat.",
  too_long: "Messages are limited to 300 characters.",
  empty: "Write something first.",
  rate_limited: "You are sending messages too fast. Wait a moment.",
  duplicate: "You just sent that.",
  slow_mode: "Slow mode is on. Wait a few seconds between messages.",
  followers_only: "Chat is for followers only right now.",
  timed_out: "You are timed out of this chat.",
  banned: "You are banned from this chat.",
  too_many_reactions: "You can add up to 5 reactions to one message.",
  already_voted: "You already voted in this poll.",
  poll_closed: "This poll has closed.",
};

/** The chat column: pinned message, poll, messages and the composer, for any viewer. */
export function ChatPanel({
  communityId,
  name,
  chat,
  ended = false,
}: {
  communityId: string;
  name: string;
  chat: CommunityChat;
  /** The broadcast is over; chat stays open. */
  ended?: boolean;
}) {
  const { messages, online, connected, loaded, error, clearError, send, react, vote } = chat;
  const { data: user } = useMe();
  const qc = useQueryClient();
  const role = useChannelRole(communityId);
  const moderator = canModerate(role);
  const { data: followState } = useFollow(communityId, !!user);
  const [replyingTo, setReplyingTo] = useState<ChatMessage | null>(null);
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ block: "end" });
  }, [messages.length, replyingTo?.id]);

  const toggleIdentity = useMutation({
    mutationFn: () => setIdentityMode(user?.identity_mode === "anonymous" ? "named" : "anonymous"),
    onSuccess: (next) => qc.setQueryData(sessionKeys.me, next),
  });
  const mod = useMutation({
    mutationFn: async (job: () => Promise<unknown>) => job(),
    onError: (e) => toast.error(e instanceof Error ? e.message : "That did not work"),
  });

  const menuFor = (m: ChatMessage): MenuItem[] => {
    const items: MenuItem[] = [];
    const own = !!user && m.author.id === user.id;
    if (own || moderator)
      items.push({
        label: "Delete message",
        danger: true,
        onSelect: () => mod.mutate(() => deleteChatMessage(communityId, m.id)),
      });
    if (moderator) {
      items.push({
        label: "Pin message",
        onSelect: () => mod.mutate(() => pinMessage(communityId, m.id)),
      });
      items.push({
        label: "Reveal who sent this",
        onSelect: () =>
          mod.mutate(async () => {
            const who = await revealAuthor(m.id);
            toast.message(`${m.author.display_name} is @${who.username}`, {
              description: "This lookup was recorded in the moderation log.",
            });
          }),
      });
      if (!own) {
        items.push({
          label: "Time out 10 minutes",
          onSelect: () =>
            mod.mutate(async () => {
              const who = await revealAuthor(m.id);
              await createBan(communityId, { user_id: who.id, minutes: 10 });
              toast.success(`@${who.username} timed out for 10 minutes`);
            }),
        });
      }
    }
    return items;
  };

  return (
    <section aria-label="Chat" className="flex h-[520px] flex-col lg:h-full">
      <header className="flex h-12 shrink-0 items-center justify-between px-5">
        <h2 className="text-sm font-semibold text-foreground">Chat</h2>
        <span className="text-xs text-muted-foreground">
          {!connected ? (
            "Reconnecting…"
          ) : ended ? (
            "Stream ended"
          ) : (
            <>
              <span className="font-num">{online.toLocaleString()}</span> here
            </>
          )}
        </span>
      </header>

      {chat.pinned && (
        <PinnedBanner message={chat.pinned} emotes={chat.emotes} me={user?.username} />
      )}
      {chat.poll && (
        <PollCard
          poll={chat.poll}
          canVote={!!user && !chat.restriction}
          onVote={(optionId) => vote(chat.poll!.id, optionId)}
        />
      )}

      <div className="min-h-0 flex-1 space-y-1 overflow-y-auto px-5 py-2" aria-live="polite">
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
          <MessageRow
            key={m.id}
            message={m}
            emotes={chat.emotes}
            meId={user?.id ?? null}
            meName={user?.username ?? null}
            canReact={!!user && !chat.restriction}
            menu={menuFor(m)}
            onReply={setReplyingTo}
            onReact={(emoji, on) => react(m.id, emoji, on)}
          />
        ))}
        <div ref={bottomRef} />
      </div>

      {ended && connected && (
        <p className="shrink-0 border-t border-border px-5 py-2 text-center text-xs text-muted-foreground">
          The stream ended. Chat stays open.
        </p>
      )}
      {error && (
        <p role="alert" className="shrink-0 px-5 pb-1 text-xs text-destructive">
          {ERROR_COPY[error.code] ?? error.message}
        </p>
      )}

      <Composer
        communityId={communityId}
        name={name}
        signedIn={!!user}
        username={user?.username ?? null}
        anonymous={user?.identity_mode === "anonymous"}
        onToggleIdentity={() => toggleIdentity.mutate()}
        identityBusy={toggleIdentity.isPending}
        connected={connected}
        settings={chat.settings}
        restriction={chat.restriction}
        following={!!followState?.following}
        privileged={moderator}
        replyingTo={replyingTo}
        onCancelReply={() => {
          setReplyingTo(null);
          clearError();
        }}
        onSend={send}
      />
    </section>
  );
}
