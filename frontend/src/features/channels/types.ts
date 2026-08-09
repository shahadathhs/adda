export interface Channel {
  id: string;
  community_id: string;
  name: string;
  slug: string;
  type: string; // text | announcement | live
  position: number;
  is_restricted: boolean;
  has_access: boolean;
  created_at: string;
}

export interface ChannelMessage {
  id: string;
  channel_id: string;
  user_id: string;
  username: string;
  display_name: string;
  content: string;
  reply_to_id: string | null;
  created_at: string;
  edited_at: string | null;
}

export interface ChannelMember {
  user_id: string;
  username: string;
  display_name: string;
  can_read: boolean;
  can_write: boolean;
}
