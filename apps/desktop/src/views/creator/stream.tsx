import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { KeyRound, Radio } from "lucide-react";
import { toast } from "sonner";
import { rotateStreamKey, updateCommunity } from "@adda/api-client";
import type { Community, StreamCredentials } from "@adda/types";
import { Badge } from "@/ui/badge";
import { Button } from "@/ui/button";
import { Input } from "@/ui/input";
import { Panel, PanelHeader } from "@/ui/panel";
import { consoleKeys, useChannelStatus, useStreamCreds } from "@/lib/data";

/** OBS setup for one channel: stream URL + key, rotation, live title. */
export function CreatorStream({ channel }: { channel: Community }) {
  const { data: creds } = useStreamCreds(channel.id, true);
  const { data: status } = useChannelStatus(channel.id);
  const qc = useQueryClient();
  const [title, setTitle] = useState(channel.stream_title ?? "");

  const rotate = useMutation({
    mutationFn: () => rotateStreamKey(channel.id),
    onSuccess: (c: StreamCredentials) => {
      qc.setQueryData(consoleKeys.streamKey(channel.id), c);
      toast.success("Key rotated — the active publisher was kicked.");
    },
    onError: (e) => toast.error(e instanceof Error ? e.message : "Could not rotate"),
  });
  const saveTitle = useMutation({
    mutationFn: () => updateCommunity(channel.id, { stream_title: title.trim() || null }),
    onSuccess: () => {
      toast.success("Title saved");
      qc.invalidateQueries({ queryKey: consoleKeys.mine });
    },
    onError: () => toast.error("Could not save the title"),
  });

  const isLive = status?.is_live ?? channel.is_live;

  return (
    <div className="max-w-2xl space-y-4 p-4">
      <div className="flex items-center justify-between">
        <h1 className="text-sm font-semibold">Go live — {channel.name}</h1>
        {isLive && (
          <Badge tone="live">
            <Radio className="h-3 w-3" /> streaming
          </Badge>
        )}
      </div>

      <Panel>
        <PanelHeader
          title="OBS setup"
          right={
            <Button
              variant="ghost"
              size="xs"
              disabled={rotate.isPending}
              onClick={() => rotate.mutate()}
            >
              <KeyRound className="h-3 w-3" /> Rotate key
            </Button>
          }
        />
        <div className="space-y-3 p-3">
          <p className="text-2xs leading-relaxed text-muted">
            OBS → Settings → Stream → Service: <strong className="text-fg">Custom</strong>. Paste
            the Stream URL as the server and leave the Stream Key field empty — your key is already
            inside the URL.
          </p>
          <div>
            <p className="mb-1 text-2xs font-semibold uppercase tracking-wider text-muted">
              Stream URL
            </p>
            {creds && (
              <>
                <p className="break-all rounded-xs border border-line bg-bg px-2 py-1.5 font-num text-2xs text-muted">
                  {creds.stream_url}
                </p>
                <div className="mt-1.5 flex justify-end">
                  <Button
                    variant="ghost"
                    size="xs"
                    onClick={() => {
                      void navigator.clipboard.writeText(creds.stream_url);
                      toast.success("Copied");
                    }}
                  >
                    Copy
                  </Button>
                </div>
              </>
            )}
          </div>
          <div>
            <p className="mb-1 text-2xs font-semibold uppercase tracking-wider text-muted">
              Stream key
            </p>
            {creds && (
              <p className="break-all rounded-xs border border-line bg-bg px-2 py-1.5 font-num text-2xs text-muted">
                {creds.stream_key}
              </p>
            )}
          </div>
        </div>
      </Panel>

      <Panel>
        <PanelHeader title="Live title" />
        <div className="flex gap-2 p-3">
          <Input
            value={title}
            maxLength={200}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="What are you streaming today?"
          />
          <Button
            variant="primary"
            size="sm"
            disabled={saveTitle.isPending || title === (channel.stream_title ?? "")}
            onClick={() => saveTitle.mutate()}
          >
            Save
          </Button>
        </div>
      </Panel>
    </div>
  );
}
