import type { Community } from "@/lib/types";

const eyebrow = "text-[11px] font-semibold uppercase tracking-[0.08em] text-muted-foreground";

/** Right-hand column when offline: the channel's about text. */
export function AboutPanel({ community }: { community: Community }) {
  return (
    <div className="p-5">
      <h2 className={eyebrow}>About</h2>
      <p className="mt-3 text-sm leading-relaxed text-muted-foreground">
        {community.description || "This channel has not written an about text yet."}
      </p>
    </div>
  );
}
