import type { DmMessage, DmPeer, DmThread } from "@adda/types";
import { request } from "../client";

export const listDmThreads = () => request<DmThread[]>("/api/dms/threads");

export const resolveDmPeer = (username: string) =>
  request<DmPeer>(`/api/dms/resolve/${encodeURIComponent(username)}`);

export const openDmThread = (peer_id: string) =>
  request<DmThread>("/api/dms/threads", {
    method: "POST",
    body: JSON.stringify({ peer_id }),
  });

export const listDmMessages = (threadId: string, before?: string) =>
  request<DmMessage[]>(
    `/api/dms/threads/${threadId}/messages${before ? `?before=${before}` : ""}`,
  );

export const sendDmMessage = (threadId: string, content: string) =>
  request<DmMessage>(`/api/dms/threads/${threadId}/messages`, {
    method: "POST",
    body: JSON.stringify({ content }),
  });

export const markDmRead = (threadId: string, message_id: string) =>
  request<{ ok: boolean }>(`/api/dms/threads/${threadId}/read`, {
    method: "POST",
    body: JSON.stringify({ message_id }),
  });

export const listBlocked = () => request<DmPeer[]>("/api/dms/blocks");

export const blockUser = (userId: string) =>
  request<{ ok: boolean }>(`/api/dms/blocks/${userId}`, { method: "POST" });

export const unblockUser = (userId: string) =>
  request<{ ok: boolean }>(`/api/dms/blocks/${userId}`, { method: "DELETE" });
