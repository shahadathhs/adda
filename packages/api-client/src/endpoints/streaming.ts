import type { DiscoverChannel, StreamHealth, StreamStatus } from "@adda/types";
import { request } from "../client";

export const streamStatus = (id: string) =>
  request<StreamStatus>(`/api/streaming/communities/${id}/status`);

export const discoverChannels = (q?: string) =>
  request<DiscoverChannel[]>(`/api/streaming/discover${q ? `?q=${encodeURIComponent(q)}` : ""}`);

export const streamHealth = (id: string) =>
  request<StreamHealth>(`/api/streaming/communities/${id}/health`);
