import type { DiscoverChannel } from "./streaming";
import type { RecordingFeedItem } from "./recording";
import type { Video } from "./video";

export interface Page<T> {
  items: T[];
  total: number;
  page: number;
  page_size: number;
}

export interface SearchResult {
  query: string;
  channels: DiscoverChannel[];
  recordings: RecordingFeedItem[];
  videos: Video[];
}

export type ChannelStatus = "all" | "live" | "offline";
export type ChannelSort = "viewers" | "followers" | "newest" | "name";
export type RecordingSort = "newest" | "oldest" | "largest";

export interface ChannelQuery {
  q?: string;
  status?: ChannelStatus;
  sort?: ChannelSort;
  page?: number;
  page_size?: number;
}

export interface RecordingQuery {
  q?: string;
  channel?: string;
  sort?: RecordingSort;
  page?: number;
  page_size?: number;
}
