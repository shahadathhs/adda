"use client";

import { useState } from "react";
import { apiBaseUrl } from "@adda/shared";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { useRecordings } from "@/lib/data";
import { useMe } from "@/lib/session";

export function RecordingsSection({ communityId }: { communityId: string }) {
  const { data: user } = useMe();
  const { data: recs = [] } = useRecordings(communityId, !!user);
  const [playing, setPlaying] = useState<string | null>(null);

  if (!user || recs.length === 0) return null;
  return (
    <section className="space-y-3">
      <h2 className="text-base font-semibold text-foreground">Recordings</h2>
      <div className="space-y-2">
        {recs.map((r) => (
          <Card key={r.path} className="p-3">
            <div className="flex items-center justify-between gap-3">
              <div className="min-w-0">
                <p className="truncate text-sm font-medium text-foreground">{r.name}</p>
                <p className="text-xs text-muted-foreground">
                  {new Date(r.created_at).toLocaleString()} ·{" "}
                  <span className="font-num">{(r.size_bytes / 1e9).toFixed(2)}</span> GB
                </p>
              </div>
              <Button
                size="sm"
                variant="outline"
                onClick={() => setPlaying(playing === r.path ? null : r.path)}
              >
                {playing === r.path ? "Hide" : "Watch"}
              </Button>
            </div>
            {playing === r.path && (
              <video
                controls
                autoPlay
                className="mt-3 w-full rounded-sm"
                src={`${apiBaseUrl()}/api/recordings/file?path=${encodeURIComponent(r.path)}`}
              />
            )}
          </Card>
        ))}
      </div>
    </section>
  );
}
