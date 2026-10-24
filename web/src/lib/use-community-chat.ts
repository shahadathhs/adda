"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { chatChannel, chatHistory, chatSince, chatState, socket } from "@/lib/api";
import { useMe } from "@/lib/session";
import type {
  ChatMessage,
  ChatSettings,
  ChatState,
  Emote,
  MessageDeletedPayload,
  ModerationPayload,
  PinUpdatePayload,
  Poll,
  ReactionUpdatePayload,
} from "@/lib/types";

const KEEP = 200;

export interface ChatError {
  code: string;
  message: string;
}

/** What the server told this account about a timeout or ban (null when none applies). */
export interface Restriction {
  action: "timeout" | "ban";
  expires_at: string | null;
}

/**
 * A channel's chat: history over REST, then live events over the WebSocket. Owns messages,
 * reactions, the pinned message, the poll, chat settings, emotes and the reconnect catch-up.
 */
export function useCommunityChat(communityId: string) {
  const qc = useQueryClient();
  const { data: me } = useMe();
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [online, setOnline] = useState(0);
  const [connected, setConnected] = useState(() => socket.connected);
  const [loaded, setLoaded] = useState(false);
  const [error, setError] = useState<ChatError | null>(null);
  const [restriction, setRestriction] = useState<Restriction | null>(null);
  const newest = useRef<string | null>(null);

  const stateKey = ["chat-state", communityId] as const;
  const { data: state } = useQuery({ queryKey: stateKey, queryFn: () => chatState(communityId) });

  const patchState = useCallback(
    (fn: (s: ChatState) => ChatState) =>
      qc.setQueryData<ChatState>(stateKey, (s) => (s ? fn(s) : s)),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [qc, communityId],
  );

  useEffect(() => {
    const channel = chatChannel(communityId);
    let cancelled = false;

    // Merge by id so a message that arrives live while history loads is never doubled.
    const merge = (prev: ChatMessage[], incoming: ChatMessage[]) => {
      const seen = new Set(prev.map((m) => m.id));
      return [...prev, ...incoming.filter((m) => !seen.has(m.id))]
        .sort((a, b) => a.created_at.localeCompare(b.created_at))
        .slice(-KEEP);
    };

    const load = (page: Awaited<ReturnType<typeof chatHistory>>) => {
      if (cancelled) return;
      setMessages((prev) =>
        merge(
          prev,
          page.map((m) => ({ ...m, channel })),
        ),
      );
    };
    chatHistory(communityId)
      .then(load)
      .catch(() => undefined)
      .finally(() => !cancelled && setLoaded(true));

    socket.connect();
    socket.subscribe(channel);
    let wasDown = false;
    const offStatus = socket.onStatus((up) => {
      setConnected(up);
      if (up && wasDown) {
        // Catch up on what was missed while the socket was down, without reloading everything.
        if (newest.current)
          chatSince(communityId, newest.current)
            .then(load)
            .catch(() => undefined);
        void qc.invalidateQueries({ queryKey: ["chat-state", communityId] });
      }
      wasDown = !up;
    });

    const off = socket.on((msg) => {
      const data = msg.data as Record<string, unknown> | undefined;
      if (msg.type === "error" && data) {
        setError(data as unknown as ChatError);
        return;
      }
      if (msg.type === "moderation" && data) {
        const d = data as unknown as ModerationPayload;
        if (d.community_id !== communityId) return;
        setRestriction(d.action === "lift" ? null : { action: d.action, expires_at: d.expires_at });
        return;
      }
      if (msg.channel !== channel || !data) return;

      switch (msg.type) {
        case "chat_message":
          setMessages((prev) => merge(prev, [data as unknown as ChatMessage]));
          break;
        case "message_deleted": {
          const { message_id } = data as unknown as MessageDeletedPayload;
          setMessages((prev) =>
            prev
              .filter((m) => m.id !== message_id)
              .map((m) =>
                m.reply?.id === message_id ? { ...m, reply: { id: message_id, deleted: true } } : m,
              ),
          );
          break;
        }
        case "reaction_update": {
          const { message_id, counts } = data as unknown as ReactionUpdatePayload;
          setMessages((prev) =>
            prev.map((m) => (m.id === message_id ? { ...m, reactions: counts } : m)),
          );
          break;
        }
        case "pin_update":
          patchState((s) => ({
            ...s,
            pinned: (data as unknown as PinUpdatePayload).message as ChatState["pinned"],
          }));
          break;
        case "poll_started":
        case "poll_update":
        case "poll_closed":
          patchState((s) => {
            const incoming = data as unknown as Poll;
            // A broadcast update has no `my_vote`; keep the one we already know.
            const mine = s.poll?.id === incoming.id ? s.poll.my_vote : null;
            return { ...s, poll: { ...incoming, my_vote: incoming.my_vote ?? mine } };
          });
          break;
        case "chat_settings":
          patchState((s) => ({ ...s, settings: data as unknown as ChatSettings }));
          break;
        case "presence": {
          const count = (data as { online_count?: number }).online_count;
          if (count != null) setOnline(count);
          break;
        }
      }
    });

    return () => {
      cancelled = true;
      off();
      offStatus();
      socket.unsubscribe(channel);
    };
  }, [communityId, qc, patchState]);

  useEffect(() => {
    newest.current = messages.length ? messages[messages.length - 1].id : null;
  }, [messages]);

  const send = useCallback(
    (content: string, replyTo?: string) => {
      setError(null);
      socket.sendChat(chatChannel(communityId), content, replyTo);
    },
    [communityId],
  );

  const react = useCallback(
    (messageId: string, emoji: string, on: boolean) => {
      setError(null);
      // Show the viewer's own toggle at once; the server's count arrives in a batched update.
      setMessages((prev) =>
        prev.map((m) => {
          if (m.id !== messageId) return m;
          const mine = new Set(m.my_reactions ?? []);
          if (on) mine.add(emoji);
          else mine.delete(emoji);
          const next = { ...m.reactions };
          const count = Math.max(0, (next[emoji] ?? 0) + (on ? 1 : -1));
          if (count === 0) delete next[emoji];
          else next[emoji] = count;
          return { ...m, my_reactions: [...mine], reactions: next };
        }),
      );
      socket.send({
        type: "react",
        channel: chatChannel(communityId),
        data: { message_id: messageId, emoji, on },
      });
    },
    [communityId],
  );

  const vote = useCallback(
    (pollId: string, optionId: string) => {
      setError(null);
      socket.send({
        type: "vote",
        channel: chatChannel(communityId),
        data: { poll_id: pollId, option_id: optionId },
      });
    },
    [communityId],
  );

  const emotes: Emote[] = state?.emotes ?? [];
  const settings: ChatSettings = state?.settings ?? { slow_mode_seconds: 0, followers_only: false };

  return {
    messages: messages.map((m) =>
      // Our own reactions are only known from history; mark ones that arrive live as empty.
      me ? { ...m, my_reactions: m.my_reactions ?? [] } : m,
    ),
    online,
    connected,
    loaded,
    error,
    clearError: () => setError(null),
    restriction,
    pinned: state?.pinned ?? null,
    poll: state?.poll ?? null,
    settings,
    emotes,
    send,
    react,
    vote,
  };
}

export type CommunityChat = ReturnType<typeof useCommunityChat>;
