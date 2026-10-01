import { request } from "@/shared/api/client";

export interface StreamStatus {
  is_live: boolean;
  viewers: number;
  started_at: string | null;
  hls_url: string;
  rtmp_ingest_url: string;
}

export interface DiscoverChannel {
  community_id: string;
  name: string;
  slug: string;
  description: string | null;
  avatar_url: string | null;
  banner_url: string | null;
  stream_title: string | null;
  is_live: boolean;
  viewers: number;
  member_count: number;
  follower_count: number;
  hls_url: string | null;
  webrtc_url: string | null;
}

export interface StreamHealth {
  community_id: string;
  is_live: boolean;
  viewers: number;
  started_at: string | null;
  uptime_seconds: number | null;
  video_codec: string | null;
  audio_codec: string | null;
}

export const streamStatus = (id: string) =>
  request<StreamStatus>(`/api/streaming/communities/${id}/status`);

export const discoverChannels = (q?: string) =>
  request<DiscoverChannel[]>(`/api/streaming/discover${q ? `?q=${encodeURIComponent(q)}` : ""}`);

export const streamHealth = (id: string) =>
  request<StreamHealth>(`/api/streaming/communities/${id}/health`);
