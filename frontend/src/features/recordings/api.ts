import { request } from "@/shared/api/client";
import type { Recording } from "./types";

export const recordings = (communityId: string) =>
  request<Recording[]>(`/api/recordings?community_id=${communityId}`);
