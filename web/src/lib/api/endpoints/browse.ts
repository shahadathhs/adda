import type {
  ChannelQuery,
  DiscoverChannel,
  Page,
  RecordingFeedItem,
  RecordingQuery,
  SearchResult,
} from "@/lib/types";
import { request } from "../client";

const qs = (params: object) => {
  const out = new URLSearchParams();
  for (const [k, v] of Object.entries(params))
    if (v !== undefined && v !== "") out.set(k, String(v));
  const s = out.toString();
  return s ? `?${s}` : "";
};

export const browseChannels = (query: ChannelQuery) =>
  request<Page<DiscoverChannel>>(`/api/browse/channels${qs(query)}`);

export const browseRecordings = (query: RecordingQuery) =>
  request<Page<RecordingFeedItem>>(`/api/browse/recordings${qs(query)}`);

export const globalSearch = (q: string, limit = 5) =>
  request<SearchResult>(`/api/search${qs({ q, limit })}`);
