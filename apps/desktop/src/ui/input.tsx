import type { InputHTMLAttributes } from "react";
import { cn } from "./cn";

export function Input({ className, ...props }: InputHTMLAttributes<HTMLInputElement>) {
  return (
    <input
      className={cn(
        "h-7 w-full rounded-sm border border-line bg-panel px-2 text-xs text-fg",
        "placeholder:text-muted/60",
        "focus:border-accent/70 focus:outline-none",
        className,
      )}
      {...props}
    />
  );
}
