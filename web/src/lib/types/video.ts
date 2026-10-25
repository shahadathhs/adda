export type VideoStatus = "uploading" | "processing" | "ready" | "failed";
export type VideoVisibility = "public" | "unlisted" | "private";
export type VideoSort = "newest" | "oldest" | "longest" | "largest";

export interface Video {
  id: string;
  community_id: string;
  community_name: string;
  community_slug: string;
  title: string;
  description: string | null;
  status: VideoStatus;
  visibility: VideoVisibility;
  size_bytes: number;
  received_bytes: number;
  duration_seconds: number | null;
  width: number | null;
  height: number | null;
  error: string | null;
  created_at: string;
  poster_url: string | null;
  file_url: string | null;
}

export interface UploadStarted {
  video: Video;
  chunk_size: number;
  max_chunk_size: number;
}

export interface VideoQuery {
  q?: string;
  channel?: string;
  sort?: VideoSort;
  page?: number;
  page_size?: number;
}
