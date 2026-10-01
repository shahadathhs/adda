import type { Recording } from "@adda/types";
import { request } from "../client";

export const recordings = (communityId: string) =>
  request<Recording[]>(`/api/recordings?community_id=${communityId}`);
