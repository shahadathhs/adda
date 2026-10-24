import { Eye } from "lucide-react";

/** Mono viewer count on a dark pill, for sitting over media. */
export function ViewerCount({ viewers }: { viewers: number }) {
  return (
    <span className="inline-flex items-center gap-1 rounded-xs bg-black/60 px-1.5 py-px text-xs text-white">
      <Eye className="h-3 w-3" aria-hidden="true" />
      <span className="font-num">{viewers.toLocaleString()}</span>
    </span>
  );
}
