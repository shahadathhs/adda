import type { ButtonHTMLAttributes } from "react";
import { cn } from "./cn";

type Variant = "default" | "primary" | "danger" | "ghost";
type Size = "xs" | "sm";

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant;
  size?: Size;
}

const variants: Record<Variant, string> = {
  default: "bg-panel2 text-fg border border-line hover:border-accent/60",
  primary: "bg-accent text-accent-fg hover:bg-accent-hover",
  danger: "bg-danger/10 text-danger border border-danger/40 hover:bg-danger/20",
  ghost: "text-muted hover:text-fg hover:bg-panel2",
};

const sizes: Record<Size, string> = {
  xs: "h-6 px-2 text-2xs gap-1",
  sm: "h-7 px-2.5 text-xs gap-1.5",
};

export function Button({ variant = "default", size = "sm", className, ...props }: ButtonProps) {
  return (
    <button
      className={cn(
        "inline-flex shrink-0 items-center justify-center rounded-sm font-medium transition-colors",
        "disabled:pointer-events-none disabled:opacity-40",
        variants[variant],
        sizes[size],
        className,
      )}
      {...props}
    />
  );
}
