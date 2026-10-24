import type { DiscoverChannel, RecordingFeedItem, SearchResult } from "@/lib/types";

export type SearchHit =
  | { kind: "channel"; channel: DiscoverChannel; href: string }
  | { kind: "recording"; recording: RecordingFeedItem; href: string }
  | { kind: "all"; href: string };

/** The dropdown's rows in order: channels, then recordings, then a link to every result. */
export function searchHits(q: string, result: SearchResult | undefined): SearchHit[] {
  const hits: SearchHit[] = [];
  for (const channel of result?.channels ?? [])
    hits.push({ kind: "channel", channel, href: `/channel/${channel.slug}` });
  for (const recording of result?.recordings ?? [])
    hits.push({
      kind: "recording",
      recording,
      href: `/channel/${recording.community_slug}/recording?path=${encodeURIComponent(recording.path)}`,
    });
  hits.push({ kind: "all", href: `/search?q=${encodeURIComponent(q.trim())}` });
  return hits;
}
