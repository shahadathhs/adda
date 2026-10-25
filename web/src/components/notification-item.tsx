import Link from "next/link";
import type { AppNotification } from "@/lib/types";
import { timeAgo } from "@/lib/time-ago";
import { cn } from "@/lib/cn";

function Body({ n }: { n: AppNotification }) {
  const p = n.payload;
  if (n.kind === "went_live")
    return (
      <>
        <span className="font-semibold">{p.community_name}</span> is live
        {p.title ? `: ${p.title}` : ""}
      </>
    );
  const verb = n.kind === "mention" ? "mentioned you" : "replied to you";
  return (
    <>
      <span className="font-semibold">{p.from ?? "Someone"}</span> {verb} in{" "}
      <span className="font-semibold">{p.community_name}</span>
      {p.excerpt ? `: ${p.excerpt}` : ""}
    </>
  );
}

/** One row in the bell: what happened, where it links, how long ago, and whether it is unread. */
export function NotificationItem({ n, onOpen }: { n: AppNotification; onOpen: () => void }) {
  return (
    <li>
      <Link
        href={`/channel/${n.payload.community_slug}`}
        onClick={onOpen}
        className={cn(
          "flex gap-2.5 rounded-sm px-3 py-2.5 text-[13px] leading-5 text-foreground outline-none transition-colors duration-120 hover:bg-secondary focus-visible:outline-2 focus-visible:outline-ring",
          !n.read && "bg-primary-subtle",
        )}
      >
        <span
          className={cn(
            "mt-1.5 h-2 w-2 shrink-0 rounded-full",
            n.read ? "bg-transparent" : "bg-primary",
          )}
          aria-label={n.read ? undefined : "Unread"}
        />
        <span className="min-w-0 flex-1">
          <span className="block break-words">
            <Body n={n} />
          </span>
          <span className="block text-xs text-muted-foreground">{timeAgo(n.created_at)}</span>
        </span>
      </Link>
    </li>
  );
}
