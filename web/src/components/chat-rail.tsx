"use client";

import { useCommunityChat } from "@/lib/data";
import { ChatPanel } from "@/components/chat/chat-panel";

/** The live chat for a channel: history and the socket, rendered by the chat panel. */
export function ChatRail({ communityId, name }: { communityId: string; name: string }) {
  const chat = useCommunityChat(communityId);
  return <ChatPanel name={name} {...chat} />;
}
