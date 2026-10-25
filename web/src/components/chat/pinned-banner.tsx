import { Pin } from "lucide-react";
import type { ChatAuthor, Emote } from "@/lib/types";
import { ChatText } from "@/components/chat/chat-text";

/** The channel's pinned message, above the chat. */
export function PinnedBanner({
  message,
  emotes,
  me,
}: {
  message: { author: ChatAuthor; content: string };
  emotes: Emote[];
  me?: string | null;
}) {
  return (
    <section
      aria-label="Pinned message"
      className="mx-3 mb-2 rounded-md border border-border bg-card px-3 py-2"
    >
      <p className="flex items-center gap-1.5 text-xs text-muted-foreground">
        <Pin className="h-3 w-3" aria-hidden="true" />
        Pinned · <span className="font-semibold">{message.author.display_name}</span>
      </p>
      <p className="mt-0.5 break-words text-[13px] leading-[1.45] text-foreground">
        <ChatText content={message.content} emotes={emotes} me={me} />
      </p>
    </section>
  );
}
