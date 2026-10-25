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
  system_role: "user" | "admin" | "superadmin";
  is_active: boolean;
  created_at: string;
}

export interface AdminCommunity {
  id: string;
  name: string;
  slug: string;
  owner_id: string;
  follower_count: number;
  is_live: boolean;
  is_suspended: boolean;
  created_at: string;
}

export interface LiveStream {
  community_id: string;
  name: string;
  viewers: number;
}
