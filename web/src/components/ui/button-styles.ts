import { cn } from "@/lib/cn";

export type Variant = "default" | "primary" | "outline" | "ghost" | "danger";
export type Size = "sm" | "md" | "lg";

const variants: Record<Variant, string> = {
  default: "bg-secondary text-secondary-foreground hover:bg-accent",
  // Marigold fill, ink text — the brand signature. Never white-on-accent.
  primary:
    "bg-primary text-primary-foreground font-semibold hover:bg-primary-hover active:bg-primary-active",
  outline: "border border-input bg-transparent hover:bg-accent hover:text-accent-foreground",
  ghost: "text-muted-foreground hover:bg-accent hover:text-foreground",
  danger: "bg-destructive text-destructive-foreground hover:bg-destructive/85",
};

const sizes: Record<Size, string> = {
  sm: "h-7 rounded-xs px-2.5 text-[13px]",
  md: "h-8 rounded-sm px-3.5 text-sm",
  lg: "h-10 rounded-sm px-5 text-sm",
};

/** Button styles, for a link that should look like a button (never nest a button in a link). */
export function buttonClass(variant: Variant = "default", size: Size = "md", className?: string) {
  return cn(
    "inline-flex cursor-pointer items-center justify-center gap-2 whitespace-nowrap font-medium",
    "transition-[background-color,border-color,color,scale] duration-120 ease-[var(--ease-micro)]",
    "active:scale-[0.97]",
    "focus-visible:outline-2 focus-visible:outline-ring focus-visible:outline-offset-2",
    "disabled:pointer-events-none disabled:opacity-50",
    variants[variant],
    sizes[size],
    className,
  );
}
