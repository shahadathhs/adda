import type { StatusExpiry } from "@/lib/types";

/** Quick picks for a status emoji. They are content the user chooses, not interface icons. */
export const STATUS_EMOJI = ["☕", "🎧", "🛠️", "📚", "🌙", "✈️", "🤒", "🎉"] as const; // design-ok: user-chosen emoji content

export const STATUS_EXPIRY: { value: StatusExpiry; label: string }[] = [
  { value: "never", label: "Don't clear" },
  { value: "hour", label: "In 1 hour" },
  { value: "today", label: "Today" },
  { value: "week", label: "In 7 days" },
];

export const STATUS_TEXT_MAX = 80;
