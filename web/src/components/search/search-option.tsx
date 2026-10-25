import Link from "next/link";
import { Clapperboard, Film, Search } from "lucide-react";
import { UserAvatar } from "@/components/ui/primitives";
import { recordingTitle } from "@/lib/recordings";
import { cn } from "@/lib/cn";
import { Highlight } from "@/components/search/highlight";
import type { SearchHit } from "@/lib/search-hits";

const row =
  "flex cursor-pointer items-center gap-3 rounded-sm px-2.5 py-2 text-left outline-none transition-colors duration-120";

/** One row of the search dropdown: a channel, a recording or the "see all" link. */
export function SearchOption({
  hit,
  q,
  id,
  active,
  onPick,
  onHover,
}: {
  hit: SearchHit;
  q: string;
  id: string;
  active: boolean;
  onPick: () => void;
  onHover: () => void;
}) {
  const shared = {
    id,
    role: "option" as const,
    "aria-selected": active,
    onMouseMove: onHover,
    onClick: onPick,
    className: cn(row, active ? "bg-secondary" : "hover:bg-secondary/60"),
  };

  if (hit.kind === "all") {
    return (
      <Link href={hit.href} {...shared} className={cn(shared.className, "text-sm text-foreground")}>
        <Search className="h-4 w-4 text-muted-foreground" aria-hidden="true" />
        <span>
          See all results for <span className="font-semibold">“{q}”</span>
        </span>
      </Link>
    );
  }

  if (hit.kind === "channel") {
    const c = hit.channel;
    return (
      <Link href={hit.href} {...shared}>
        <UserAvatar name={c.name} src={c.avatar_url} className="h-8 w-8 text-xs" />
        <span className="min-w-0 flex-1">
          <span className="block truncate text-sm text-muted-foreground">
            <Highlight text={c.name} q={q} />
          </span>
          <span className="block truncate text-xs text-muted-foreground/80">
            {c.is_live && c.stream_title ? c.stream_title : `@${c.slug}`}
          </span>
        </span>
        {c.is_live && (
          <span className="inline-flex items-center gap-1.5 rounded-xs bg-live px-1.5 py-0.5 text-[11px] font-bold uppercase tracking-wide text-white">
            Live
            <span className="font-num normal-case">{c.viewers}</span>
          </span>
        )}
      </Link>
    );
  }

  if (hit.kind === "video") {
    const v = hit.video;
    return (
      <Link href={hit.href} {...shared}>
        <span className="grid h-8 w-8 shrink-0 place-items-center rounded-sm bg-background text-muted-foreground">
          <Clapperboard className="h-4 w-4" aria-hidden="true" />
        </span>
        <span className="min-w-0 flex-1">
          <span className="block truncate text-sm text-muted-foreground">
            <Highlight text={v.title} q={q} />
          </span>
          <span className="block truncate text-xs text-muted-foreground/80">
            {v.community_name} · video
          </span>
        </span>
      </Link>
    );
  }

  const r = hit.recording;
  return (
    <Link href={hit.href} {...shared}>
      <span className="grid h-8 w-8 shrink-0 place-items-center rounded-sm bg-background text-muted-foreground">
        <Film className="h-4 w-4" aria-hidden="true" />
      </span>
      <span className="min-w-0 flex-1">
        <span className="block truncate text-sm text-muted-foreground">
          <Highlight text={recordingTitle(r.name)} q={q} />
        </span>
        <span className="block truncate text-xs text-muted-foreground/80">
          {r.community_name} ·{" "}
          {new Date(r.created_at).toLocaleDateString([], { month: "short", day: "numeric" })}
        </span>
      </span>
    </Link>
  );
}
