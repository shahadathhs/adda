import type { ChatHistoryMessage } from "@/lib/types";
import { request } from "../client";

/** One page of a channel's chat, newest first. Pass the oldest id as `before` for the next page. */
export const chatHistory = (communityId: string, before?: string, limit = 50) =>
  request<ChatHistoryMessage[]>(
    `/api/communities/${communityId}/messages?limit=${limit}${before ? `&before=${before}` : ""}`,
  );

export const deleteChatMessage = (communityId: string, messageId: string) =>
  request<void>(`/api/communities/${communityId}/messages/${messageId}`, { method: "DELETE" });
