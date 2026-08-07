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

export interface StreamCredentials {
  stream_url: string;
  stream_key: string;
}

export interface AdminStats {
  users: number;
  communities: number;
  live: number;
}

export interface AdminUser {
  id: string;
  username: string;
  email: string;
  display_name: string;
  is_admin: boolean;
  is_active: boolean;
  created_at: string;
}

export interface AdminCommunity {
  id: string;
  name: string;
  slug: string;
  owner_id: string;
  member_count: number;
  is_live: boolean;
  is_suspended: boolean;
  created_at: string;
}

export interface AdminMember {
  user_id: string;
  username: string;
  display_name: string;
  role: string;
  joined_at: string;
}

export interface LiveStream {
  community_id: string;
  name: string;
  viewers: number;
}

export interface Recording {
  community_id: string | null;
  name: string;
  path: string;
  size_bytes: number;
  created_at: string;
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

// ── WebSocket protocol (must mirror backend/modules/realtime/protocol.py) ──
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
