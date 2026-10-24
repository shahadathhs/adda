"use client";

import { useState } from "react";
import { apiBaseUrl } from "@/lib/config";
import { useRecordings } from "@/lib/data";
import { recordingTitle } from "@/lib/recordings";
import { StreamThumb } from "@/components/stream-thumb";

/** A channel's recordings as a grid; choosing one plays it above the grid. */
export function RecordingsSection({
  communityId,
  communityName,
  selected,
  onSelect,
}: {
  communityId: string;
  communityName: string;
  selected: string | null;
  onSelect: (path: string | null) => void;
}) {
  const { data: recs, isPending } = useRecordings(communityId, true);
  const [failed, setFailed] = useState(false);

  if (isPending) return <p className="text-sm text-muted-foreground">Loading recordings…</p>;
  if (!recs?.length)
    return (
      <p className="text-sm text-muted-foreground">
        No recordings yet. Every broadcast is saved here once it ends.
      </p>
    );

  const playing = recs.find((r) => r.path === selected);
  return (
    <div className="space-y-4">
      {playing && (
        <div className="overflow-hidden rounded-lg border border-border bg-black">
          <video
            key={playing.path}
            controls
            autoPlay
            onError={() => setFailed(true)}
            className="aspect-video w-full"
            src={`${apiBaseUrl()}/api/recordings/file?path=${encodeURIComponent(playing.path)}`}
          />
          {failed && (
            <p role="alert" className="p-3 text-sm text-muted-foreground">
              This recording could not be played.
            </p>
          )}
        </div>
      )}
      <ul className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
        {recs.map((r) => (
          <li key={r.path}>
            <button
              type="button"
              aria-pressed={r.path === selected}
              onClick={() => {
                setFailed(false);
                onSelect(r.path === selected ? null : r.path);
              }}
              className="group block w-full overflow-hidden rounded-lg border border-border bg-card text-left outline-none transition-[border-color] duration-120 hover:border-muted-foreground/40 focus-visible:outline-2 focus-visible:outline-ring aria-pressed:border-primary"
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
            </button>
          </li>
        ))}
      </ul>
    </div>
  );
}
