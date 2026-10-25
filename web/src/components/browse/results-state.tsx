import type { ReactNode } from "react";
import { Button } from "@/components/ui/button";

/** What to show instead of a list: an error with a retry, or an empty state. */
export function ResultsMessage({
  kind,
  children,
  onRetry,
  action,
}: {
  kind: "empty" | "error";
  children: ReactNode;
  onRetry?: () => void;
  action?: ReactNode;
}) {
  return (
    <div
      role={kind === "error" ? "alert" : undefined}
      className="mt-6 flex min-h-[200px] flex-col items-center justify-center gap-3 rounded-lg border border-border bg-card px-6 py-10 text-center"
    >
      <p className="max-w-md text-sm text-muted-foreground">{children}</p>
      {kind === "error" && onRetry && (
        <Button variant="outline" onClick={onRetry}>
          Try again
        </Button>
      )}
      {action}
    </div>
  );
}
