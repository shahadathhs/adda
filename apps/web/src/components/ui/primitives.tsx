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
        "flex items-center justify-center rounded-full bg-primary/15 font-semibold text-primary",
        className,
      )}
      aria-label={name}
    >
      {initials(name) || "?"}
    </div>
  );
}

export function LiveBadge({ viewers }: { viewers?: number }) {
  return (
    <span className="flex items-center gap-1 rounded-full bg-red-500/20 px-2 py-0.5 text-xs font-medium text-red-500 dark:text-red-400">
      <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-red-500" /> LIVE
      {viewers != null && viewers > 0 && <span className="ml-1">{viewers}</span>}
    </span>
  );
}

export function Meta({ children, className }: { children: ReactNode; className?: string }) {
  return <p className={cn("text-xs text-muted-foreground", className)}>{children}</p>;
}
