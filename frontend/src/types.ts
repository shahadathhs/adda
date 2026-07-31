export interface User {
  id: string;
  username: string;
  email: string;
  display_name: string;
  avatar_url: string | null;
  bio: string | null;
  is_admin: boolean;
}

export interface Token {
  access_token: string;
  token_type: string;
  user: User;
}

export interface Community {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  banner_url: string | null;
  avatar_url: string | null;
  is_private: boolean;
  owner_id: string;
  member_count: number;
  is_live: boolean;
}

export interface ChatMessage {
  id: string;
  channel: string;
  user_id: string;
  username: string;
  display_name: string;
  content: string;
  created_at: string;
  reply_to: string | null;
}

// ── WebSocket protocol (must mirror backend/ws/protocol.py) ──
export type ClientMessageType =
  | "subscribe"
  | "unsubscribe"
  | "chat_message"
  | "ping";

export type ServerMessageType =
  | "subscribed"
  | "unsubscribed"
  | "chat_message"
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
