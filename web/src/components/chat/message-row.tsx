"use client";

import { CornerUpLeft } from "lucide-react";
import type { ChatMessage, Emote } from "@/lib/types";
import { ChatText } from "@/components/chat/chat-text";
import { MessageMenu, type MenuItem } from "@/components/chat/message-menu";
import { ReactionBar } from "@/components/chat/reaction-bar";
import { ReactionPicker } from "@/components/chat/reaction-picker";
import { MAX_REACTIONS_PER_MESSAGE } from "@/lib/reactions";
import { cn } from "@/lib/cn";

// Chat name colours: per user, stable, from the chart family (violet is banned).
const NAME_COLORS = [
  "var(--chart-3)",
  "var(--chart-2)",
  "var(--chart-4)",
  "var(--chart-1)",
  "var(--chart-5)",
];
const ANONYMOUS_COLOR = "var(--muted-foreground)";

const nameColor = (userId: string | null) => {
  if (!userId) return ANONYMOUS_COLOR;
  let hash = 0;
  for (let i = 0; i < userId.length; i++) hash = (hash * 31 + userId.charCodeAt(i)) | 0;
  return NAME_COLORS[Math.abs(hash) % NAME_COLORS.length];
};

const BADGE: Record<string, { label: string; cls: string }> = {
  owner: { label: "Owner", cls: "bg-primary-subtle text-primary" },
  moderator: { label: "Mod", cls: "bg-ok/15 text-ok" },
  follower: { label: "Follower", cls: "bg-secondary text-muted-foreground" },
};

/** One chat message: badges, name, text with emotes, a reply preview and reactions. */
export function MessageRow({
  message: m,
  emotes,
  meId,
  meName,
  canReact,
  menu,
  onReply,
  onReact,
}: {
  message: ChatMessage;
  emotes: Emote[];
  meId: string | null;
  meName: string | null;
  canReact: boolean;
  menu: MenuItem[];
  onReply: (m: ChatMessage) => void;
  onReact: (emoji: string, on: boolean) => void;
}) {
  const mine = m.my_reactions ?? [];
  const mentioned = !!meId && m.mentions.includes(meId);
  const atCap = mine.length >= MAX_REACTIONS_PER_MESSAGE;

  return (
    <div
      className={cn(
        "group relative -mx-2 rounded-sm px-2 py-1 text-[13px] leading-[1.45] text-foreground",
        mentioned && "bg-primary-subtle",
      )}
    >
      {m.reply && (
        <p className="mb-0.5 flex items-center gap-1 text-xs text-muted-foreground">
          <CornerUpLeft className="h-3 w-3 shrink-0" aria-hidden="true" />
          {m.reply.deleted ? (
            <span className="italic">Replying to a message that was deleted</span>
          ) : (
            <span className="truncate">
              Replying to <span className="font-semibold">{m.reply.author?.display_name}</span>{" "}
              {m.reply.content}
            </span>
          )}
        </p>
      )}
      <p className="break-words">
        {m.author.badges
          .filter((b) => BADGE[b])
          .map((b) => (
            <span
              key={b}
              className={cn(
                "mr-1 inline-block rounded-xs px-1.5 align-baseline text-[10px] font-semibold uppercase leading-[14px] tracking-[0.03em]",
                BADGE[b].cls,
              )}
            >
              {BADGE[b].label}
            </span>
          ))}
        <span
          className={cn("font-semibold", !m.author.id && "italic")}
          style={{ color: nameColor(m.author.id) }}
        >
          {m.author.display_name}
        </span>
        : <ChatText content={m.content} emotes={emotes} me={meName} />
      </p>
      <ReactionBar reactions={m.reactions} mine={mine} canReact={canReact} onToggle={onReact} />

      {canReact && (
        <div className="absolute -top-3 right-1 z-10 hidden items-center gap-0.5 rounded-md border border-border bg-popover p-0.5 shadow-[0_4px_16px_rgba(0,0,0,0.5)] group-focus-within:flex group-hover:flex [@media(hover:none)]:flex">
          <button
            type="button"
            aria-label={`Reply to ${m.author.display_name}`}
            onClick={() => onReply(m)}
            className="grid h-6 w-6 place-items-center rounded-xs text-muted-foreground hover:bg-secondary hover:text-foreground focus-visible:outline-2 focus-visible:outline-ring"
          >
            <CornerUpLeft className="h-4 w-4" aria-hidden="true" />
          </button>
          {!atCap && <ReactionPicker onPick={(emoji) => onReact(emoji, true)} />}
          <MessageMenu items={menu} label="More actions for this message" />
        </div>
      )}
    </div>
  );
}
