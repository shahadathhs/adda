import type {
  Ban,
  ChatHistoryMessage,
  ChatSettings,
  ChatState,
  Emote,
  ModAction,
  Poll,
} from "@/lib/types";
import { request } from "../client";

/** One page of a channel's chat, newest first. Pass the oldest id as `before` for the next page. */
export const chatHistory = (communityId: string, before?: string, limit = 50) =>
  request<ChatHistoryMessage[]>(
    `/api/communities/${communityId}/messages?limit=${limit}${before ? `&before=${before}` : ""}`,
  );

/** Messages sent after `after`, for catching up once the socket is back. */
export const chatSince = (communityId: string, after: string) =>
  request<ChatHistoryMessage[]>(
    `/api/communities/${communityId}/messages?after=${after}&limit=100`,
  );

export const deleteChatMessage = (communityId: string, messageId: string) =>
  request<void>(`/api/communities/${communityId}/messages/${messageId}`, { method: "DELETE" });

/** Settings, pinned message, poll and emotes: everything but the messages. */
export const chatState = (communityId: string) =>
  request<ChatState>(`/api/communities/${communityId}/chat-state`);

export const setChatSettings = (communityId: string, data: Partial<ChatSettings>) =>
  request<ChatSettings>(`/api/communities/${communityId}/chat-settings`, {
    method: "PUT",
    body: JSON.stringify(data),
  });

export const pinMessage = (communityId: string, messageId: string) =>
  request<void>(`/api/communities/${communityId}/pin`, {
    method: "POST",
    body: JSON.stringify({ message_id: messageId }),
  });

export const unpinMessage = (communityId: string) =>
  request<void>(`/api/communities/${communityId}/pin`, { method: "DELETE" });

/** Who is behind a message. Moderators only; every call is audited. */
export const revealAuthor = (messageId: string) =>
  request<{ id: string; username: string; display_name: string }>(
    `/api/chat/messages/${messageId}/author`,
  );

// ── Timeouts and bans ──
export const listBans = (communityId: string) =>
  request<Ban[]>(`/api/communities/${communityId}/bans`);

export const createBan = (
  communityId: string,
  data: { user_id: string; minutes?: number | null; reason?: string },
) =>
  request<Ban>(`/api/communities/${communityId}/bans`, {
    method: "POST",
    body: JSON.stringify(data),
  });

export const liftBan = (communityId: string, banId: string) =>
  request<void>(`/api/communities/${communityId}/bans/${banId}`, { method: "DELETE" });

export const listModActions = (communityId: string) =>
  request<ModAction[]>(`/api/communities/${communityId}/mod-actions`);

// ── Polls ──
export const startPoll = (
  communityId: string,
  data: { question: string; options: string[]; duration_seconds: number },
) =>
  request<Poll>(`/api/communities/${communityId}/polls`, {
    method: "POST",
    body: JSON.stringify(data),
  });

export const endPoll = (pollId: string) =>
  request<void>(`/api/polls/${pollId}/end`, { method: "POST" });

// ── Emotes ──
export const listEmotes = (communityId: string) =>
  request<Emote[]>(`/api/communities/${communityId}/emotes`);

export const uploadEmote = (communityId: string, name: string, file: File) => {
  const form = new FormData();
  form.append("name", name);
  form.append("file", file);
  return request<Emote>(`/api/communities/${communityId}/emotes`, { method: "POST", body: form });
};

export const deleteEmote = (communityId: string, name: string) =>
  request<void>(`/api/communities/${communityId}/emotes/${encodeURIComponent(name)}`, {
    method: "DELETE",
  });
