import type { DiscoverChannel, StreamHealth, StreamStatus } from "@adda/types";
import { request } from "../client";

export const streamStatus = (id: string) =>
  request<StreamStatus>(`/api/streaming/communities/${id}/status`);

export const discoverChannels = (q?: string) =>
  request<DiscoverChannel[]>(`/api/streaming/discover${q ? `?q=${encodeURIComponent(q)}` : ""}`);

export const streamHealth = (id: string) =>
  request<StreamHealth>(`/api/streaming/communities/${id}/health`);

/** Disconnect the active publisher (channel moderators + system staff). */
export const stopStream = (id: string) =>
  request<void>(`/api/streaming/communities/${id}/stop`, { method: "POST" });
