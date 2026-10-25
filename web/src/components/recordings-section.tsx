"use client";

import Link from "next/link";
import { useRecordings } from "@/lib/data";
import { recordingTitle } from "@/lib/recordings";
import { StreamThumb } from "@/components/stream-thumb";

/** A channel's recordings as a grid of links to the playback page. */
export function RecordingsSection({
  communityId,
  communityName,
  communitySlug,
}: {
  communityId: string;
  communityName: string;
  communitySlug: string;
}) {
  const { data: recs, isPending } = useRecordings(communityId, true);

  if (isPending) return <p className="text-sm text-muted-foreground">Loading recordings…</p>;
  if (!recs?.length)
    return (
      <p className="text-sm text-muted-foreground">
        No recordings yet. Every broadcast is saved here once it ends.
      </p>
    );

  return (
    <ul className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
      {recs.map((r) => (
        <li key={r.path}>
          <Link
            href={`/channel/${communitySlug}/recording?path=${encodeURIComponent(r.path)}`}
            className="group block overflow-hidden rounded-lg border border-border bg-card outline-none transition-[translate,border-color] duration-120 ease-[var(--ease-micro)] hover:-translate-y-0.5 hover:border-muted-foreground/40 focus-visible:outline-2 focus-visible:outline-ring"
          >
            <div className="relative border-b border-border">
              <StreamThumb communityId={communityId} name={communityName} />
              <span className="absolute left-2 top-2 rounded-xs bg-black/60 px-1.5 py-px text-[11px] font-bold uppercase tracking-wide text-white/80">
                Recording
              </span>
            </div>
            <div className="px-3 pb-3 pt-2.5">
              <p className="truncate text-sm font-semibold text-foreground">
                {recordingTitle(r.name)}
              </p>
              <p className="text-[13px] text-muted-foreground">
                {new Date(r.created_at).toLocaleDateString([], {
                  month: "short",
                  day: "numeric",
                  year: "numeric",
                })}
                {" · "}
                <span className="font-num">{(r.size_bytes / 1e9).toFixed(2)}</span> GB
              </p>
            </div>
          </Link>
        </li>
      ))}
    </ul>
  );
}
