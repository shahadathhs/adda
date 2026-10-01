import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { KeyRound, Radio, Square } from "lucide-react";
import { toast } from "sonner";
import { rotateStreamKey, stopStream, updateCommunity } from "@adda/api-client";
import type { Community, StreamCredentials } from "@adda/types";
import { hlsBaseUrl } from "@adda/shared";
import { Badge } from "@/ui/badge";
import { Button } from "@/ui/button";
import { Input } from "@/ui/input";
import { Panel, PanelHeader } from "@/ui/panel";
import { LivePlayer } from "@/components/live-player";
import { consoleKeys, useChannelStatus, useStreamCreds } from "@/lib/data";

/** Go-live cockpit for one channel: preview, stop, OBS setup, title. */
export function CreatorStream({ channel }: { channel: Community }) {
  const { data: creds } = useStreamCreds(channel.id, true);
  const { data: status } = useChannelStatus(channel.id);
  const qc = useQueryClient();
  const [title, setTitle] = useState(channel.stream_title ?? "");

  const isLive = status?.is_live ?? channel.is_live;
  const hlsUrl = `${hlsBaseUrl()}/community/${channel.id}/index.m3u8`;

  const rotate = useMutation({
    mutationFn: () => rotateStreamKey(channel.id),
    onSuccess: (c: StreamCredentials) => {
      qc.setQueryData(consoleKeys.streamKey(channel.id), c);
      toast.success("Key rotated — the active publisher was kicked.");
    },
    onError: (e) => toast.error(e instanceof Error ? e.message : "Could not rotate"),
  });
  const stop = useMutation({
    mutationFn: () => stopStream(channel.id),
    onSuccess: () => {
      toast.success("Stream stopped — publisher disconnected.");
      qc.invalidateQueries({ queryKey: consoleKeys.status(channel.id) });
    },
    onError: (e) => toast.error(e instanceof Error ? e.message : "Could not stop"),
  });
  const saveTitle = useMutation({
    mutationFn: () => updateCommunity(channel.id, { stream_title: title.trim() || null }),
    onSuccess: () => {
      toast.success("Title saved");
      qc.invalidateQueries({ queryKey: consoleKeys.mine });
    },
    onError: () => toast.error("Could not save the title"),
  });

  return (
    <div className="max-w-2xl space-y-4 p-4">
      <div className="flex items-center justify-between">
        <h1 className="text-sm font-semibold">Stream — {channel.name}</h1>
        {isLive ? (
          <Badge tone="live">
            <Radio className="h-3 w-3" /> live · {status?.viewers ?? 0} watching
          </Badge>
        ) : (
          <Badge>offline</Badge>
        )}
      </div>

      {/* Live preview / standby */}
      <Panel>
        <PanelHeader
          title={isLive ? "Live preview" : "Preview — waiting for signal"}
          right={
            isLive ? (
              <Button
                variant="danger"
                size="xs"
                disabled={stop.isPending}
                onClick={() => stop.mutate()}
              >
                <Square className="h-3 w-3" /> Stop stream
              </Button>
            ) : undefined
          }
        />
        <div className="p-3">
          {isLive ? (
            <LivePlayer hlsUrl={hlsUrl} />
          ) : (
            <div className="flex aspect-video w-full items-center justify-center rounded-sm border border-dashed border-line bg-bg">
              <div className="text-center">
                <Radio className="mx-auto h-6 w-6 text-muted/40" />
                <p className="mt-2 text-2xs text-muted">
                  Start broadcasting in OBS — the preview appears here automatically.
                </p>
              </div>
            </div>
          )}
        </div>
      </Panel>

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
          {isLive && (
            <p className="border-t border-line pt-2 text-2xs leading-relaxed text-muted">
              <strong className="text-fg">Stop</strong> disconnects the publisher instantly, but OBS
              auto-reconnects while the key is valid — rotate the key for a hard lockout.
            </p>
          )}
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
