/** The reactions the server accepts (mirrors ALLOWED in backend chat/service/reactions.py). */
export const REACTIONS = ["👍", "❤️", "😂", "😮", "🎉", "👏", "🔥", "☕"] as const; // design-ok: user-chosen emoji content, not icons

/** Most distinct reactions one account can put on a message. */
export const MAX_REACTIONS_PER_MESSAGE = 5;
