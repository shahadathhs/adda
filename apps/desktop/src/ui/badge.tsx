import type { ReactNode } from "react";
import { cn } from "./cn";

type Tone = "neutral" | "live" | "ok" | "danger" | "accent";

const tones: Record<Tone, string> = {
  neutral: "bg-panel2 text-muted border-line",
  live: "bg-live/15 text-live border-live/40",
  ok: "bg-ok/15 text-ok border-ok/40",
  danger: "bg-danger/15 text-danger border-danger/40",
  accent: "bg-accent/15 text-accent border-accent/40",
};

export function Badge({
  tone = "neutral",
  className,
  children,
}: {
  tone?: Tone;
  className?: string;
  children: ReactNode;
}) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 rounded-xs border px-1.5 py-px text-2xs font-medium",
        tones[tone],
        className,
      )}
    >
      {children}
    </span>
  );
}
