import type { Page, UploadStarted, Video, VideoQuery } from "@/lib/types";
import { apiBaseUrl } from "@/lib/config";
import { ApiError, getToken, refreshSession, request } from "../client";

export const startVideoUpload = (
  communityId: string,
  data: {
    title: string;
    description?: string | null;
    visibility: Video["visibility"];
    filename: string;
    size_bytes: number;
  },
) =>
  request<UploadStarted>(`/api/communities/${communityId}/videos`, {
    method: "POST",
    body: JSON.stringify(data),
  });

export const completeVideoUpload = (videoId: string) =>
  request<Video>(`/api/videos/${videoId}/complete`, { method: "POST" });

export const channelVideos = (communityId: string) =>
  request<Video[]>(`/api/communities/${communityId}/videos`);

export const getVideo = (videoId: string) => request<Video>(`/api/videos/${videoId}`);

export const updateVideo = (
  videoId: string,
  data: { title?: string; description?: string | null; visibility?: Video["visibility"] },
) => request<Video>(`/api/videos/${videoId}`, { method: "PATCH", body: JSON.stringify(data) });

export const deleteVideo = (videoId: string) =>
  request<void>(`/api/videos/${videoId}`, { method: "DELETE" });

export const browseVideos = (query: VideoQuery) => {
  const params = new URLSearchParams();
  for (const [k, v] of Object.entries(query))
    if (v !== undefined && v !== "") params.set(k, String(v));
  const s = params.toString();
  return request<Page<Video>>(`/api/browse/videos${s ? `?${s}` : ""}`);
};

/**
 * Send one part of a video. XMLHttpRequest, not fetch, because only it reports how much of the
 * body has gone out. Refreshes an expired session once and retries.
 */
export function putVideoChunk(
  videoId: string,
  offset: number,
  part: Blob,
  onProgress: (sent: number) => void,
  signal?: AbortSignal,
): Promise<number> {
  const attempt = () =>
    new Promise<number>((resolve, reject) => {
      const xhr = new XMLHttpRequest();
      xhr.open("PUT", `${apiBaseUrl()}/api/videos/${videoId}/chunk?offset=${offset}`);
      const token = getToken();
      if (token) xhr.setRequestHeader("Authorization", `Bearer ${token}`);
      xhr.setRequestHeader("Content-Type", "application/octet-stream");
      xhr.upload.onprogress = (e) => onProgress(e.loaded);
      xhr.onerror = () => reject(new ApiError("The connection dropped", 0));
      xhr.onabort = () => reject(new DOMException("Upload cancelled", "AbortError"));
      xhr.onload = () => {
        let body: { detail?: string; received_bytes?: number } = {};
        try {
          body = JSON.parse(xhr.responseText) as typeof body;
        } catch {
          /* not JSON */
        }
        if (xhr.status >= 200 && xhr.status < 300)
          resolve(body.received_bytes ?? offset + part.size);
        else reject(new ApiError(body.detail ?? xhr.statusText, xhr.status));
      };
      signal?.addEventListener("abort", () => xhr.abort(), { once: true });
      xhr.send(part);
    });

  return attempt().catch(async (e: unknown) => {
    if (e instanceof ApiError && e.status === 401 && (await refreshSession())) return attempt();
    throw e;
  });
}
