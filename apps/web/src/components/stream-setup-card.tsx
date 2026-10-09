"use client";

import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { KeyRound } from "lucide-react";
import { toast } from "sonner";
import { getStreamKey, rotateStreamKey, updateCommunity } from "@adda/api-client";
import type { Community, StreamCredentials } from "@adda/types";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { webKeys } from "@/lib/data";

/** Owner-only: OBS setup — stream URL/key, rotation, live title. */
export function StreamSetupCard({ community }: { community: Community }) {
  const qc = useQueryClient();
  const [title, setTitle] = useState(community.stream_title ?? "");
  const { data: creds } = useQuery({
    queryKey: ["stream-key", community.id],
    queryFn: () => getStreamKey(community.id),
  });
  const rotate = useMutation({
    mutationFn: () => rotateStreamKey(community.id),
    onSuccess: (c: StreamCredentials) => {
      qc.setQueryData(["stream-key", community.id], c);
      toast.success("Key rotated — update OBS with the new URL.");
    },
    onError: () => toast.error("Could not rotate the key"),
  });
  const saveTitle = useMutation({
    mutationFn: () => updateCommunity(community.id, { stream_title: title.trim() || null }),
    onSuccess: () => {
      toast.success("Stream title saved");
      qc.invalidateQueries({ queryKey: webKeys.detail(community.id) });
    },
    onError: () => toast.error("Could not save the title"),
  });

  return (
    <Card className="space-y-3 p-4">
      <div className="flex items-center justify-between">
        <h2 className="flex items-center gap-2 text-base font-semibold text-foreground">
          <KeyRound className="h-4 w-4 text-primary" aria-hidden="true" />
          Stream setup
        </h2>
        <Button
          variant="outline"
          size="sm"
          disabled={rotate.isPending}
          onClick={() => rotate.mutate()}
        >
          Rotate key
        </Button>
      </div>
      <p className="text-xs text-muted-foreground">
        OBS → Settings → Stream → Service: <strong>Custom</strong> — paste the stream URL as the
        server, leave the key field empty.
      </p>
      {creds && (
        <div>
          <p className="mb-1 text-xs text-muted-foreground">Stream URL (includes your key)</p>
          <p className="break-all rounded-sm border border-border bg-input/50 px-2 py-1.5 font-num text-xs text-foreground">
            {creds.stream_url}
          </p>
          <div className="mt-2 flex justify-end">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => {
                void navigator.clipboard.writeText(creds.stream_url);
                toast.success("Stream URL copied");
              }}
            >
              Copy URL
            </Button>
          </div>
        </div>
      )}
      <div className="flex gap-2 border-t border-border pt-3">
        <Input
          value={title}
          maxLength={200}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="Stream title (shown while live)"
          aria-label="Stream title"
        />
        <Button
          variant="primary"
          size="sm"
          disabled={saveTitle.isPending || title === (community.stream_title ?? "")}
          onClick={() => saveTitle.mutate()}
        >
          Save
        </Button>
      </div>
    </Card>
  );
}
