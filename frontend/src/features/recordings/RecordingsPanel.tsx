import { useState } from "react";
import { API_BASE_URL } from "@/shared/config";
import { Card } from "@/shared/ui/card";
import { useRecordings } from "./hooks";
import type { Recording } from "./types";

function fmtSize(n: number) {
  if (n < 1024 * 1024) return `${(n / 1024).toFixed(0)} KB`;
  return `${(n / (1024 * 1024)).toFixed(1)} MB`;
}

export default function RecordingsPanel({ communityId }: { communityId: string }) {
  const { data: recs = [], isLoading: loading } = useRecordings(communityId);
  const [active, setActive] = useState<Recording | null>(null);

  const src = active
    ? `${API_BASE_URL}/api/recordings/file?path=${encodeURIComponent(active.path)}`
    : null;

  if (loading) return <p className="text-sm text-muted-foreground">Loading…</p>;
  if (recs.length === 0)
    return (
      <Card className="flex aspect-video flex-col items-center justify-center gap-2 px-6 text-center">
        <p className="text-sm font-medium">No recordings yet</p>
        <p className="max-w-sm text-xs text-muted-foreground">
          Recordings show up here automatically after a stream ends.
        </p>
      </Card>
    );

  return (
    <div className="space-y-4">
      {src && (
        <video
          key={src}
          controls
          autoPlay
          className="aspect-video w-full rounded-lg bg-black"
          src={src}
        />
      )}
      <Card className="divide-y divide-border">
        {recs.map((r) => (
          <button
            key={r.path}
            onClick={() => setActive(r)}
            className={`flex w-full items-center justify-between px-4 py-3 text-left text-sm transition-colors hover:bg-muted/50 ${
              active?.path === r.path ? "bg-muted/50" : ""
            }`}
          >
            <div className="min-w-0">
              <div className="truncate font-medium">{new Date(r.created_at).toLocaleString()}</div>
              <div className="text-xs text-muted-foreground">{fmtSize(r.size_bytes)}</div>
            </div>
            <span className="shrink-0 text-xs text-primary">
              {active?.path === r.path ? "Playing" : "Play"}
            </span>
          </button>
        ))}
      </Card>
    </div>
  );
}
