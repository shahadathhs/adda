import { useEffect, useRef, useState } from "react";
import { socket, chatChannel } from "../lib/ws";
import type { ChatMessage, ServerMessage } from "../types";

/**
 * Subscribe to a community's live chat channel and collect messages.
 * Proves the realtime loop end-to-end (broadcast via Redis).
 */
export function useChat(communityId: string | undefined) {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [onlineCount, setOnlineCount] = useState(0);
  const channel = communityId ? chatChannel(communityId) : null;
  const channelRef = useRef<string | null>(null);

  useEffect(() => {
    if (!channel) return;
    socket.connect();
    socket.subscribe(channel);
    channelRef.current = channel;

    const off = socket.on((msg: ServerMessage) => {
      if (msg.channel !== channel) return;
      if (msg.type === "chat_message" && msg.data) {
        setMessages((prev) => [...prev, msg.data as unknown as ChatMessage]);
      } else if (msg.type === "presence" && msg.data) {
        setOnlineCount(Number((msg.data as { online_count: number }).online_count));
      }
    });

    return () => {
      off();
      socket.unsubscribe(channel);
      channelRef.current = null;
    };
  }, [channel]);

  const send = (content: string) => {
    if (!channel || !content.trim()) return;
    socket.sendChat(channel, content.trim());
  };

  return { messages, onlineCount, send };
}
