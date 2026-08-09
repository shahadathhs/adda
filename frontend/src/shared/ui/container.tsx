import { cn } from "@/shared/lib/utils";

/** Page content wrapper — caps width at 1024px (max-w-5xl) and centers it. */
export function Container({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div className={cn("mx-auto w-full max-w-5xl px-4 sm:px-6 lg:px-8", className)} {...props} />
  );
}
