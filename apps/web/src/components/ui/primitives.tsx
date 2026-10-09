import type { ReactNode } from "react";
import { cn } from "@/lib/cn";

const initials = (name: string) =>
  name
    .split(/\s+/)
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
        src={src}
        alt={name}
        className={cn("rounded-full object-cover", className)}
        loading="lazy"
      />
    );
  }
  return (
    <div
      className={cn(
        "flex items-center justify-center rounded-full bg-primary-subtle font-semibold text-primary",
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
      <span className="live-dot !h-1.5 !w-1.5" aria-hidden="true" />
      LIVE
      {viewers != null && viewers > 0 && <span className="font-num normal-case">{viewers}</span>}
    </span>
  );
}

export function Meta({ children, className }: { children: ReactNode; className?: string }) {
  return <p className={cn("text-xs text-muted-foreground", className)}>{children}</p>;
}
