/** A message from the chat history endpoint (`GET /communities/{id}/messages`). */
export interface ChatHistoryMessage {
  id: string;
  community_id: string;
  user_id: string;
  username: string;
  display_name: string;
  content: string;
  reply_to_id: string | null;
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
