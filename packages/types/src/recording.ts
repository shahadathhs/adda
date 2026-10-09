export interface Recording {
  community_id: string | null;
  name: string;
  path: string;
  size_bytes: number;
  created_at: string;
}

export interface RecordingFeedItem {
  community_id: string;
  name: string;
  path: string;
  size_bytes: number;
  created_at: string;
  community_name: string;
  community_slug: string;
}
