"use client";

import { useMutation, useQuery } from "@tanstack/react-query";
import { Eye, Timer } from "lucide-react";
import { toast } from "sonner";
import { stopStream, streamHealth } from "@adda/api-client";
import { useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { LiveBadge } from "@/components/ui/primitives";

const uptime = (seconds: number) => {
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  const s = seconds % 60;
  return [h > 0 ? `${h}h` : null, m > 0 || h > 0 ? `${m}m` : null, `${s}s`]
    .filter(Boolean)
    .join(" ");
};

/** Studio › Live — the broadcast monitor: status, viewers, uptime, codecs, stop. */
export function StudioLive({ communityId }: { communityId: string }) {
  const qc = useQueryClient();
  const { data: health, refetch } = useQuery({
    queryKey: ["studio-health", communityId],
    queryFn: () => streamHealth(communityId),
    refetchInterval: 5000,
  });
  const stop = useMutation({
    mutationFn: () => stopStream(communityId),
    onSuccess: () => {
      toast.success("Stream stopped");
      qc.invalidateQueries({ queryKey: ["studio-health", communityId] });
      qc.invalidateQueries({ queryKey: webKeysDiscover() });
    },
    onError: (e) => toast.error(e instanceof Error ? e.message : "Could not stop the stream"),
  });

  const isLive = health?.is_live ?? false;

  return (
    <Card className="p-5">
      {isLive ? (
        <div className="space-y-5">
          <div className="flex flex-wrap items-center gap-5">
            <LiveBadge />
            <span className="inline-flex items-center gap-1.5 text-sm text-muted-foreground">
              <Eye className="h-4 w-4" aria-hidden="true" />
              <span className="font-num text-foreground">{health?.viewers ?? 0}</span> viewers
            </span>
            {health?.uptime_seconds != null && (
              <span className="inline-flex items-center gap-1.5 text-sm text-muted-foreground">
                <Timer className="h-4 w-4" aria-hidden="true" />
                <span className="font-num text-foreground">
                  {uptime(health.uptime_seconds)}
                </span>{" "}
                uptime
              </span>
            )}
            <div className="ml-auto flex items-center gap-2">
              {health?.video_codec && (
                <span className="rounded-xs bg-secondary px-2 py-0.5 font-num text-xs text-muted-foreground">
                  {health.video_codec}
                </span>
              )}
              {health?.audio_codec && (
                <span className="rounded-xs bg-secondary px-2 py-0.5 font-num text-xs text-muted-foreground">
                  {health.audio_codec}
                </span>
              )}
              <Button
                variant="danger"
                size="sm"
                disabled={stop.isPending}
                onClick={() => stop.mutate()}
              >
                Stop stream
              </Button>
            </div>
          </div>
          <p className="text-xs text-muted-foreground">
            Live monitor refreshes every 5 seconds. Force-stop kicks the publisher immediately.
          </p>
        </div>
      ) : (
        <div className="flex flex-col items-center gap-2 py-10 text-center">
          <p className="font-display text-lg font-bold text-foreground">Offline</p>
          <p className="max-w-sm text-sm text-muted-foreground">
            Start broadcasting from OBS — your stream URL and key are under the Setup tab.
          </p>
          <Button variant="ghost" size="sm" onClick={() => refetch()}>
            Refresh
          </Button>
        </div>
      )}
    </Card>
  );
}

// Local key helper to avoid importing lib/data into a leaf component.
function webKeysDiscover() {
  return ["discover"];
}
