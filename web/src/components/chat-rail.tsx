"use client";

import { useCommunityChat } from "@/lib/data";
import { ChatPanel } from "@/components/chat/chat-panel";

/** The live chat for a channel: history and the socket, rendered by the chat panel. */
export function ChatRail({
  communityId,
  name,
  ended = false,
}: {
  communityId: string;
  name: string;
  ended?: boolean;
}) {
  const chat = useCommunityChat(communityId);
  return <ChatPanel name={name} ended={ended} {...chat} />;
}
