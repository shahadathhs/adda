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
export type ClientMessageType = "subscribe" | "unsubscribe" | "chat_message" | "ping";

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
