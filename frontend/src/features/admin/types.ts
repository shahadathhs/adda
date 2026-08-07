export interface AdminStats {
  users: number;
  communities: number;
  live: number;
}

export interface AdminUser {
  id: string;
  username: string;
  email: string;
  display_name: string;
  is_admin: boolean;
  is_active: boolean;
  created_at: string;
}

export interface AdminCommunity {
  id: string;
  name: string;
  slug: string;
  owner_id: string;
  member_count: number;
  is_live: boolean;
  is_suspended: boolean;
  created_at: string;
}

export interface AdminMember {
  user_id: string;
  username: string;
  display_name: string;
  role: string;
  joined_at: string;
}

export interface LiveStream {
  community_id: string;
  name: string;
  viewers: number;
}
