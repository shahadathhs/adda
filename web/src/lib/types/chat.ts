/** Who is shown behind a message. Anonymous authors carry no id or username. */
export interface ChatAuthor {
  id: string | null;
  username: string | null;
  display_name: string;
  avatar_url: string | null;
  badges: ("owner" | "moderator" | "follower")[];
}

/** A short preview of the message being replied to; `deleted` marks a tombstone. */
export interface ReplyPreview {
  id: string;
  deleted: boolean;
  content?: string | null;
  author?: ChatAuthor | null;
}

/** A message from the chat history endpoint (`GET /communities/{id}/messages`). */
export interface ChatHistoryMessage {
  id: string;
  community_id: string;
  author: ChatAuthor;
  content: string;
  reply_to: string | null;
  reply: ReplyPreview | null;
  /** Ids of the accounts @mentioned in this message. */
  mentions: string[];
  /** Reaction counts by emoji. */
  reactions: Record<string, number>;
  /** The signed-in viewer's own reactions (history only). */
  my_reactions?: string[];
  created_at: string;
}

/** A channel moderator (`GET /communities/{id}/moderators`). */
export interface Moderator {
  user_id: string;
  username: string;
  display_name: string;
  avatar_url: string | null;
  since: string;
}

export interface Emote {
  name: string;
  url: string;
  created_at?: string;
}

export interface PollOption {
  id: string;
  label: string;
  votes: number;
  percent: number;
}

export interface Poll {
  id: string;
  community_id: string;
  question: string;
  status: "open" | "closed";
  closes_at: string;
  total: number;
  my_vote: string | null;
  options: PollOption[];
}

export interface ChatSettings {
  slow_mode_seconds: number;
  followers_only: boolean;
}

/** Everything a chat needs besides its messages (`GET /communities/{id}/chat-state`). */
export interface ChatState {
  settings: ChatSettings;
  pinned: ChatHistoryMessage | null;
  poll: Poll | null;
  emotes: Emote[];
}

export interface Ban {
  id: string;
  user_id: string;
  username: string;
  display_name: string;
  reason: string | null;
  expires_at: string | null;
  created_at: string;
}

export interface ModAction {
  id: string;
  action: string;
  actor: string | null;
  target: string | null;
  detail: string | null;
  created_at: string;
}
