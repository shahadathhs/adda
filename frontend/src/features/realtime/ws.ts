import { WS_BASE_URL } from "@/shared/config";
import { getToken } from "@/shared/api/client";
import type { ServerMessage } from "./types";

type MessageHandler = (msg: ServerMessage) => void;

/**
 * WebSocket client. Mirrors the protocol in backend/modules/realtime/protocol.py.
 * Auto-reconnects with backoff and re-subscribes to active channels.
 */
class AddaSocket {
  private ws: WebSocket | null = null;
  private handlers = new Set<MessageHandler>();
  private channels = new Set<string>();
  private reconnectAttempts = 0;
  private reconnectTimer: ReturnType<typeof setTimeout> | null = null;
  private pingTimer: ReturnType<typeof setInterval> | null = null;
  public connected = false;

  connect(): void {
    const token = getToken();
    if (!token) return;
    if (this.ws && this.ws.readyState <= WebSocket.OPEN) return;

    this.ws = new WebSocket(`${WS_BASE_URL}/ws?token=${encodeURIComponent(token)}`);

    this.ws.onopen = () => {
      this.connected = true;
      this.reconnectAttempts = 0;
      this.startPing();
      // Re-subscribe to any channels we were on before a reconnect.
      this.channels.forEach((c) => this.send({ type: "subscribe", channel: c }));
    };

    this.ws.onmessage = (event) => {
      try {
        const msg = JSON.parse(event.data) as ServerMessage;
        this.handlers.forEach((h) => h(msg));
      } catch {
        /* ignore malformed */
      }
    };

    this.ws.onclose = () => {
      this.connected = false;
      this.stopPing();
      this.scheduleReconnect();
    };

    this.ws.onerror = () => {
      this.ws?.close();
    };
  }

  private scheduleReconnect() {
    if (this.reconnectTimer) return;
    const delay = Math.min(1000 * 2 ** this.reconnectAttempts, 15000);
    this.reconnectAttempts += 1;
    this.reconnectTimer = setTimeout(() => {
      this.reconnectTimer = null;
      this.connect();
    }, delay);
  }

  private startPing() {
    this.stopPing();
    this.pingTimer = setInterval(() => this.send({ type: "ping" }), 30000);
  }

  private stopPing() {
    if (this.pingTimer) clearInterval(this.pingTimer);
    this.pingTimer = null;
  }

  send(payload: Record<string, unknown>): void {
    if (this.ws?.readyState === WebSocket.OPEN) {
      this.ws.send(JSON.stringify(payload));
    }
  }

  subscribe(channel: string): void {
    this.channels.add(channel);
    this.send({ type: "subscribe", channel });
  }

  unsubscribe(channel: string): void {
    this.channels.delete(channel);
    this.send({ type: "unsubscribe", channel });
  }

  sendChat(channel: string, content: string, replyTo?: string): void {
    this.send({ type: "chat_message", channel, data: { content, reply_to: replyTo } });
  }

  on(handler: MessageHandler): () => void {
    this.handlers.add(handler);
    return () => this.handlers.delete(handler);
  }

  disconnect(): void {
    this.stopPing();
    if (this.reconnectTimer) clearTimeout(this.reconnectTimer);
    this.reconnectTimer = null;
    this.ws?.close();
    this.ws = null;
  }
}

export const socket = new AddaSocket();

// Convenience channel-name builders (must match backend conventions).
export const chatChannel = (communityId: string) => `community/${communityId}/chat`;
export const presenceChannel = (communityId: string) => `community/${communityId}/presence`;
export const communityChannel = (communityId: string) => `community/${communityId}`;
// DB-backed channel topic: channel:<uuid> — gateway parses + persists.
export const channelTopic = (channelId: string) => `channel:${channelId}`;
