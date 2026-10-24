import type { ReactNode } from "react";
import { cn } from "@/lib/cn";

/** A boxed message for the reset flow: `warn` for a server limitation, `error` for a dead link. */
export function AuthNotice({ tone, children }: { tone: "warn" | "error"; children: ReactNode }) {
  return (
    <div
      role={tone === "error" ? "alert" : "status"}
      className={cn(
        "rounded-md border bg-card px-3.5 py-3 text-[13px] leading-5 text-foreground",
        tone === "error" ? "border-destructive/60" : "border-warn/60 text-warn",
      )}
    >
      {children}
    </div>
  );
}
