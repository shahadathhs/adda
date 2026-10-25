"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { stopStream } from "@/lib/api";
import { useStreamStatus } from "@/lib/data";
import { Button } from "@/components/ui/button";
import { LiveBadge } from "@/components/ui/primitives";
import { Elapsed } from "@/components/elapsed";

/** Top-right of the studio: OFFLINE, or LIVE with the elapsed time and an End stream button. */
export function StudioStatus({ channelId }: { channelId: string }) {
  const qc = useQueryClient();
  const { data: status } = useStreamStatus(channelId);
  const stop = useMutation({
    mutationFn: () => stopStream(channelId),
    onSuccess: () => {
      toast.success("Stream ended");
      void qc.invalidateQueries();
    },
    onError: (e) => toast.error(e instanceof Error ? e.message : "Could not end the stream"),
  });

  if (!status?.is_live) {
    return (
      <span className="rounded-xs bg-secondary px-2 py-0.5 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
        Offline
      </span>
    );
  }
  return (
    <div className="flex items-center gap-2.5">
      <LiveBadge />
      {status.started_at && (
        <span className="text-[13px] text-muted-foreground">
          <Elapsed since={status.started_at} />
        </span>
      )}
      <Button variant="danger" disabled={stop.isPending} onClick={() => stop.mutate()}>
        {stop.isPending ? "Ending…" : "End stream"}
      </Button>
    </div>
  );
}
