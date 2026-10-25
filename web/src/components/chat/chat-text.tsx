import type { Emote } from "@/lib/types";
import { tokenize } from "@/lib/chat-text";
import { mediaUrl } from "@/lib/media-url";
import { cn } from "@/lib/cn";

/** A message body: @mentions emphasised, `:name:` replaced by the channel's emote image. */
export function ChatText({
  content,
  emotes,
  me,
}: {
  content: string;
  emotes: Emote[];
  /** Your username, so a mention of you is marked. */
  me?: string | null;
}) {
  const byName = new Map(emotes.map((e) => [e.name, e]));
  const tokens = tokenize(content, new Set(byName.keys()));
  return (
    <>
      {tokens.map((t, i) => {
        if (t.kind === "emote") {
          const emote = byName.get(t.name)!;
          return (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              key={i}
              src={mediaUrl(emote.url) ?? emote.url}
              alt={`:${t.name}:`}
              title={`:${t.name}:`}
              className="mx-0.5 inline-block h-5 w-5 align-text-bottom"
            />
          );
        }
        if (t.kind === "mention") {
          const mine = !!me && t.value.slice(1).toLowerCase() === me.toLowerCase();
          return (
            <span
              key={i}
              className={cn("font-semibold", mine ? "text-primary" : "text-foreground")}
            >
              {t.value}
            </span>
          );
        }
        return <span key={i}>{t.value}</span>;
      })}
    </>
  );
}
