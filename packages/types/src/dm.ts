// Direct messages — API surface (mirrors backend/modules/dms/).

export interface DmPeer {
  id: string;
  username: string;
  display_name: string;
  avatar_url: string | null;
}

export interface DmMessage {
  id: string;
  thread_id: string;
  sender_id: string;
  content: string;
  created_at: string;
}

export interface DmThread {
  id: string;
  peer: DmPeer;
  last_message: DmMessage | null;
  unread_count: number;
  created_at: string;
}
