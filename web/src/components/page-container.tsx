import { cn } from "@/lib/cn";

/** The one content width: centred, capped at 1280px, so wide screens get even margins. */
export function PageContainer({ className, ...props }: React.ComponentPropsWithoutRef<"div">) {
  return <div className={cn("mx-auto w-full max-w-[1280px]", className)} {...props} />;
}
