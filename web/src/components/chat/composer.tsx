"use client";

import { useState } from "react";
import Link from "next/link";
import { CornerUpLeft, Send, X } from "lucide-react";
import type { ChatMessage, ChatSettings } from "@/lib/types";
import type { Restriction } from "@/lib/use-community-chat";
import { FollowButton } from "@/components/home/follow-button";
import { Button } from "@/components/ui/button";

const MAX = 300;
const time = (iso: string) =>
  new Date(iso).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });

/** What the message box can say instead of letting you type. */
function blockedBy({
  restriction,
  settings,
  following,
  privileged,
}: {
  restriction: Restriction | null;
  settings: ChatSettings;
  following: boolean;
  privileged: boolean;
}): string | "follow" | null {
  if (restriction?.action === "ban") return "You are banned from this chat.";
  if (restriction?.action === "timeout") {
    const until = restriction.expires_at;
    if (!until || new Date(until).getTime() > Date.now())
      return until ? `You are timed out until ${time(until)}.` : "You are timed out.";
  }
  if (settings.followers_only && !following && !privileged) return "follow";
  return null;
}

/** The message box: reply chip, counter, identity switch, and the reasons you cannot send. */
export function Composer({
  communityId,
  name,
  signedIn,
  username,
  anonymous,
  onToggleIdentity,
  identityBusy,
  connected,
  settings,
  restriction,
  following,
  privileged,
  replyingTo,
  onCancelReply,
  onSend,
}: {
  communityId: string;
  name: string;
  signedIn: boolean;
  username: string | null;
  anonymous: boolean;
  onToggleIdentity: () => void;
  identityBusy: boolean;
  connected: boolean;
  settings: ChatSettings;
  restriction: Restriction | null;
  following: boolean;
  privileged: boolean;
  replyingTo: ChatMessage | null;
  onCancelReply: () => void;
  onSend: (text: string, replyTo?: string) => void;
}) {
  const [draft, setDraft] = useState("");

  if (!signedIn) {
    return (
      <div className="shrink-0 space-y-2.5 border-t border-border p-4">
        <p className="text-[13px] text-muted-foreground">
          You are watching as a guest. Sign in to chat, react and follow.
        </p>
        <div className="flex gap-2">
          <Link href="/login">
            <Button variant="primary">Sign in</Button>
          </Link>
          <Link href="/register">
            <Button variant="outline">Create account</Button>
          </Link>
        </div>
      </div>
    );
  }

  const blocked = blockedBy({ restriction, settings, following, privileged });
  if (blocked === "follow") {
    return (
      <div className="shrink-0 space-y-2.5 border-t border-border p-4">
        <p className="text-[13px] text-muted-foreground">Chat is for followers only right now.</p>
        <FollowButton communityId={communityId} solid />
      </div>
    );
  }
  if (blocked) {
    return (
      <p
        role="status"
        className="shrink-0 border-t border-border p-4 text-center text-[13px] text-muted-foreground"
      >
        {blocked}
      </p>
    );
  }

  return (
    <form
      className="shrink-0 p-3"
      onSubmit={(e) => {
        e.preventDefault();
        const text = draft.trim();
        if (!text || !connected) return;
        onSend(text, replyingTo?.id);
        setDraft("");
        onCancelReply();
      }}
    >
      {replyingTo && (
        <p className="mb-1.5 flex items-center gap-1.5 rounded-sm bg-secondary px-2 py-1 text-xs text-muted-foreground">
          <CornerUpLeft className="h-3 w-3 shrink-0" aria-hidden="true" />
          <span className="min-w-0 flex-1 truncate">
            Replying to <span className="font-semibold">{replyingTo.author.display_name}</span>{" "}
            {replyingTo.content}
          </span>
          <button
            type="button"
            aria-label="Cancel reply"
            onClick={onCancelReply}
            className="grid h-5 w-5 place-items-center rounded-xs hover:bg-background focus-visible:outline-2 focus-visible:outline-ring"
          >
            <X className="h-3 w-3" aria-hidden="true" />
          </button>
        </p>
      )}
      <div className="flex items-center gap-2 rounded-md border border-input bg-input/50 pl-3 pr-1.5 focus-within:outline-2 focus-within:outline-ring">
        <input
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          placeholder={connected ? `Say something to ${name}…` : "Reconnecting… your draft is kept"}
          aria-label="Chat message"
          maxLength={MAX}
          className="h-9 min-w-0 flex-1 bg-transparent text-sm text-foreground outline-none placeholder:text-muted-foreground"
        />
        <button
          type="submit"
          disabled={!draft.trim() || !connected}
          aria-label="Send"
          className="grid h-7 w-7 place-items-center rounded-sm text-primary transition-colors duration-120 hover:bg-secondary disabled:text-muted-foreground/50"
        >
          <Send className="h-4 w-4" aria-hidden="true" />
        </button>
      </div>
      {(settings.slow_mode_seconds > 0 || settings.followers_only) && (
        <p className="mt-1.5 px-1 text-xs text-muted-foreground">
          {settings.slow_mode_seconds > 0 && (
            <>
              Slow mode: <span className="font-num">{settings.slow_mode_seconds}s</span> between
              messages.{" "}
            </>
          )}
          {settings.followers_only && "Followers-only chat."}
        </p>
      )}
      <div className="mt-2 flex items-center justify-between px-1 text-xs text-muted-foreground">
        <span>
          Chatting as{" "}
          <span className="font-semibold text-foreground">
            {anonymous ? "Anonymous" : username}
          </span>
          {" · "}
          <button
            type="button"
            disabled={identityBusy}
            onClick={onToggleIdentity}
            className="text-primary hover:underline"
          >
            {anonymous ? "switch to my name" : "switch to anonymous"}
          </button>
        </span>
        <span className="font-num">
          {draft.length}/{MAX}
        </span>
      </div>
    </form>
  );
}
