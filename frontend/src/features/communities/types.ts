export interface Community {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  banner_url: string | null;
  avatar_url: string | null;
  is_private: boolean;
  owner_id: string;
  member_count: number;
  is_live: boolean;
}

export interface StreamCredentials {
  stream_url: string;
  stream_key: string;
}

export interface MemberOut {
  user_id: string;
  username: string;
  display_name: string;
  avatar_url: string | null;
  bio: string | null;
  role: string;
  joined_at: string;
}

export interface JoinRequestOut {
  id: string;
  user_id: string;
  username: string;
  display_name: string;
  avatar_url: string | null;
  status: string;
  created_at: string;
}
