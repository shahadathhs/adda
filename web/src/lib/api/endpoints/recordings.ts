import type { Recording, RecordingComment, RecordingFeedItem } from "@/lib/types";
import { request } from "../client";

export const recordings = (communityId: string) =>
  request<Recording[]>(`/api/recordings?community_id=${communityId}`);

export const recentRecordings = (limit = 12) =>
  request<RecordingFeedItem[]>(`/api/recordings/recent?limit=${limit}`);

export const recordingComments = (communityId: string, path: string, sort: "time" | "recent") =>
  request<RecordingComment[]>(
    `/api/recordings/comments?community_id=${communityId}&path=${encodeURIComponent(path)}&sort=${sort}`,
  );

export const addRecordingComment = (
  communityId: string,
  path: string,
  atSeconds: number,
  body: string,
) =>
  request<RecordingComment>("/api/recordings/comments", {
    method: "POST",
    body: JSON.stringify({ community_id: communityId, path, at_seconds: atSeconds, body }),
  });

export const deleteRecordingComment = (id: string) =>
  request<void>(`/api/recordings/comments/${id}`, { method: "DELETE" });

export const deleteRecording = (communityId: string, path: string) =>
  request<void>(
    `/api/recordings/file?community_id=${communityId}&path=${encodeURIComponent(path)}`,
    { method: "DELETE" },
  );
