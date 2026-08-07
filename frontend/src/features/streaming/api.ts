import { request } from "@/shared/api/client";

export interface StreamStatus {
  is_live: boolean;
  hls_url: string;
  rtmp_ingest_url: string;
}

export const streamStatus = (id: string) =>
  request<StreamStatus>(`/api/streaming/communities/${id}/status`);
