import { Avatar, AvatarFallback, AvatarImage } from "@/shared/ui/avatar";
import { initials } from "@/shared/lib/utils";

/**
 * Domain wrapper over shadcn's compound Avatar: keeps the simple
 * `{ name, src }` API used across the app and the brand purple fallback.
 */
export function UserAvatar({
  name,
  src,
  className,
}: {
  name: string;
  src?: string | null;
  className?: string;
}) {
  return (
    <Avatar className={className}>
      {src ? <AvatarImage src={src} alt={name} /> : null}
      <AvatarFallback className="bg-primary/20 text-primary">{initials(name)}</AvatarFallback>
    </Avatar>
  );
}
