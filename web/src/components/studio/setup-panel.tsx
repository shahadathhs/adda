"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { getStreamKey, rotateStreamKey } from "@/lib/api";
import type { Community } from "@/lib/types";
import { Button } from "@/components/ui/button";
import { CopyField } from "@/components/studio/copy-field";
import { splitCredentials } from "@/lib/stream-credentials";

/** Server URL and stream key for the encoder, with key rotation. */
export function SetupPanel({ community }: { community: Community }) {
  const qc = useQueryClient();
  const { data: creds, isPending } = useQuery({
    queryKey: ["stream-key", community.id],
    queryFn: () => getStreamKey(community.id),
  });
  const rotate = useMutation({
    mutationFn: () => rotateStreamKey(community.id),
    onSuccess: (next) => {
      qc.setQueryData(["stream-key", community.id], next);
      toast.success("Stream key rotated. Update your encoder.");
    },
    onError: () => toast.error("Could not rotate the key"),
  });

  const parts = creds ? splitCredentials(creds) : null;

  return (
    <section className="space-y-5 rounded-md border border-border bg-card p-5">
      <div>
        <h2 className="font-display text-base font-semibold text-foreground">
          Connect your encoder
        </h2>
        <p className="mt-0.5 text-[13px] text-muted-foreground">
          Paste these into OBS. They identify your channel to the server.
        </p>
      </div>

      {isPending || !parts ? (
        <p className="text-sm text-muted-foreground" role="status">
          Loading your stream details…
        </p>
      ) : (
        <>
          <CopyField id="rtmp-server" label="Server (RTMP URL)" value={parts.server} />
          <div>
            <CopyField id="stream-key" label="Stream key" value={parts.key} secret />
            <p className="mt-1.5 text-xs text-muted-foreground/80">
              Anyone with this key can broadcast as you. Never share it in chat.
            </p>
          </div>
          <div>
            <CopyField
              id="full-url"
              label="Server and key together"
              value={`${parts.server}/${parts.key}`}
              secret
            />
            <p className="mt-1.5 text-xs text-muted-foreground/80">
              One address with the key included. Paste it as the server in OBS and leave the key
              empty, or use it in any other encoder.
            </p>
          </div>
        </>
      )}

      <div className="flex items-center justify-between gap-4 border-t border-border pt-4">
        <div>
          <p className="text-sm font-semibold text-foreground">Rotate stream key</p>
          <p className="text-[13px] text-muted-foreground">
            Disconnects any encoder using the current key.
          </p>
        </div>
        <Button
          variant="outline"
          disabled={rotate.isPending}
          onClick={() => {
            if (window.confirm("Rotate the key? Your encoder is disconnected until you update it."))
              rotate.mutate();
          }}
        >
          {rotate.isPending ? "Rotating…" : "Rotate key"}
        </Button>
      </div>
    </section>
  );
}
