/** Who is shown behind a message. Anonymous authors carry no id or username. */
export interface ChatAuthor {
  id: string | null;
  username: string | null;
  display_name: string;
  avatar_url: string | null;
  badges: ("owner" | "moderator" | "follower")[];
}

/** A message from the chat history endpoint (`GET /communities/{id}/messages`). */
export interface ChatHistoryMessage {
  id: string;
  community_id: string;
  author: ChatAuthor;
  content: string;
  reply_to: string | null;
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
