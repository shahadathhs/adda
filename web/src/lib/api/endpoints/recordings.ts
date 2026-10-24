import type { Recording, RecordingFeedItem } from "@/lib/types";
import { request } from "../client";

export const recordings = (communityId: string) =>
  request<Recording[]>(`/api/recordings?community_id=${communityId}`);

export const recentRecordings = (limit = 12) =>
  request<RecordingFeedItem[]>(`/api/recordings/recent?limit=${limit}`);
