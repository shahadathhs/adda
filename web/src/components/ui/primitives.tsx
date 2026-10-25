import type { ReactNode } from "react";
import { cn } from "@/lib/cn";
import { mediaUrl } from "@/lib/media-url";
import { toneClass } from "@/lib/tone";

const initials = (name: string) =>
  name
    .split(/[\s_-]+/)
    .map((w) => w[0])
    .filter(Boolean)
    .slice(0, 2)
    .join("")
    .toUpperCase();

export function UserAvatar({
  name,
  src,
  className,
}: {
  name: string;
  src?: string | null;
  className?: string;
}) {
  if (src) {
    return (
      // eslint-disable-next-line @next/next/no-img-element
      <img
        src={mediaUrl(src) ?? src}
        alt={name}
        className={cn("rounded-full object-cover", className)}
        loading="lazy"
      />
    );
  }
  return (
    <div
      className={cn(
        "flex shrink-0 items-center justify-center rounded-full font-semibold",
        toneClass(name),
        className,
      )}
      aria-label={name}
    >
      {initials(name) || "?"}
    </div>
  );
}

// LIVE badge — live red fill, white 11px 700 uppercase, radius-xs,
// pulse dot (DESIGN.md §7). Never the marigold accent.
export function LiveBadge({ viewers }: { viewers?: number }) {
  return (
    <span className="inline-flex items-center gap-1.5 rounded-xs bg-live px-1.5 py-0.5 text-[11px] font-bold uppercase tracking-wide text-white">
      <span className="h-1.5 w-1.5 rounded-full bg-white" aria-hidden="true" />
      LIVE
      {viewers != null && viewers > 0 && <span className="font-num normal-case">{viewers}</span>}
    </span>
  );
}

export function Meta({ children, className }: { children: ReactNode; className?: string }) {
  return <p className={cn("text-xs text-muted-foreground", className)}>{children}</p>;
}
