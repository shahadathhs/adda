export interface Community {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  banner_url: string | null;
  avatar_url: string | null;
  is_private: boolean;
  stream_title: string | null;
  owner_id: string;
  follower_count: number;
  is_live: boolean;
  links?: ChannelLink[];
  /** The requesting user's role on this channel: owner or moderator (filled by /mine). */
  my_role?: "owner" | "moderator" | null;
}

export interface StreamCredentials {
  stream_url: string;
  stream_key: string;
}

export interface Follower {
  id: string;
  username: string;
  display_name: string;
  avatar_url: string | null;
  since?: string | null;
}

export interface ChannelLink {
  label: string;
  url: string;
}

export interface Announcement {
  id: string;
  body: string;
  pinned: boolean;
  created_at: string;
}
