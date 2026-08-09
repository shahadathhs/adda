import { useEffect, useState } from "react";
import { chatChannel, channelTopic, socket } from "./ws";
import { useChannelMessages } from "@/features/channels/hooks";
import type { ChannelMessage } from "@/features/channels/types";
import type { ServerMessage } from "./types";

/**
 * Unified chat hook.
 *
 * - With channelId: DB-backed channel — loads persisted history + live WS.
 *   Topic: `channel:<uuid>`. Messages survive reloads.
 *
 * - Without channelId: global community chat — ephemeral broadcast.
 *   Topic: `community/<id>/chat`. Any authenticated user can participate.
 */
export function useCommunityChat(communityId: string | undefined, channelId?: string) {
  const isChannel = !!channelId;
  const { data: history } = useChannelMessages(isChannel ? communityId : undefined, channelId);
  const [live, setLive] = useState<ChannelMessage[]>([]);
  const [onlineCount, setOnlineCount] = useState(0);

  const topic = isChannel
    ? channelId
      ? channelTopic(channelId)
      : null
    : communityId
      ? chatChannel(communityId)
      : null;

  useEffect(() => {
    setLive([]);
    if (!topic) return;
    socket.connect();
    socket.subscribe(topic);

    const off = socket.on((msg: ServerMessage) => {
      if (msg.channel !== topic) return;
      if (msg.type === "chat_message" && msg.data) {
        setLive((prev) => [...prev, msg.data as unknown as ChannelMessage]);
      } else if (msg.type === "presence" && msg.data) {
        setOnlineCount(Number((msg.data as { online_count: number }).online_count));
      }
    });

    return () => {
      off();
      socket.unsubscribe(topic);
    };
  }, [topic]);

  const send = (content: string) => {
    if (!topic || !content.trim()) return;
    socket.sendChat(topic, content.trim());
  };

  // Channel mode: merge persisted history (reversed to oldest-first) + live.
  // Global mode: ephemeral only.
  const messages = isChannel ? [...(history ?? []).reverse(), ...live] : live;

  return { messages, onlineCount, send };
}
