import type { ChatAuthor, Poll, ReplyPreview } from "./chat";
import type { AppNotification } from "./notification";

/** A live chat message (`chat_message`); same shape as a history message plus its channel. */
export interface ChatMessage {
  id: string;
  channel: string;
  community_id: string;
  author: ChatAuthor;
  content: string;
  created_at: string;
  reply_to: string | null;
  reply: ReplyPreview | null;
  mentions: string[];
  reactions: Record<string, number>;
  my_reactions?: string[];
}

// ── WebSocket protocol (must mirror backend/modules/realtime/protocol.py) ──
export type ClientMessageType =
  "subscribe" | "unsubscribe" | "chat_message" | "react" | "vote" | "ping";

export type ServerMessageType =
  | "subscribed"
  | "unsubscribed"
  | "chat_message"
  | "message_deleted"
  | "reaction_update"
  | "pin_update"
  | "poll_started"
  | "poll_update"
  | "poll_closed"
  | "chat_settings"
  | "moderation"
  | "presence"
  | "stream_status"
  | "notification"
  | "error"
  | "pong";

export interface ServerMessage {
  type: ServerMessageType;
  channel?: string;
  data?: Record<string, unknown>;
}

// Typed `data` payloads, for the messages that carry one.
export interface MessageDeletedPayload {
  message_id: string;
}
export interface ReactionUpdatePayload {
  message_id: string;
  counts: Record<string, number>;
}
export interface PinUpdatePayload {
  message: ChatMessage | null;
}
export type PollPayload = Poll;
export interface ModerationPayload {
  community_id: string;
  action: "timeout" | "ban" | "lift";
  expires_at: string | null;
}
export type NotificationPayload = AppNotification;

// Shape of `data` for a `stream_status` message (mirrors StreamStatusPayload).
export interface StreamStatusPayload {
  community_id: string;
  is_live: boolean;
  viewers: number;
  started_at: string | null;
}

/** Codes in the `data.code` of a server `error` message. */
export type ChatErrorCode =
  | "auth_required"
  | "forbidden"
  | "invalid_channel"
  | "not_found"
  | "empty"
  | "too_long"
  | "banned"
  | "timed_out"
  | "followers_only"
  | "slow_mode"
  | "rate_limited"
  | "duplicate"
  | "bad_emoji"
  | "too_many_reactions"
  | "poll_closed"
  | "bad_option"
  | "already_voted";
