import type { ReactNode } from "react";
import { cn } from "./cn";

export function Panel({ className, children }: { className?: string; children: ReactNode }) {
  return <div className={cn("rounded-sm border border-line bg-panel", className)}>{children}</div>;
}

export function PanelHeader({ title, right }: { title: ReactNode; right?: ReactNode }) {
  return (
    <div className="flex h-8 items-center justify-between border-b border-line px-3">
      <span className="text-2xs font-semibold uppercase tracking-wider text-muted">{title}</span>
      {right}
    </div>
  );
}
