import { Link2 } from "lucide-react";
import type { ChannelLink } from "@/lib/types";

/** A channel's links. They open in a new tab and never pass the referrer on. */
export function LinksList({ links }: { links: ChannelLink[] }) {
  if (links.length === 0) return null;
  return (
    <ul className="space-y-1.5">
      {links.map((l) => (
        <li key={`${l.label}-${l.url}`}>
          <a
            href={l.url}
            target="_blank"
            rel="noopener noreferrer nofollow"
            className="inline-flex items-center gap-1.5 text-[13px] text-primary hover:underline focus-visible:outline-2 focus-visible:outline-ring"
          >
            <Link2 className="h-3.5 w-3.5" aria-hidden="true" />
            {l.label}
          </a>
        </li>
      ))}
    </ul>
  );
}
