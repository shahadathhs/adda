import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Eye, Film, Heart, KeyRound, Radio, Square, Users } from "lucide-react";
import { toast } from "sonner";
import { stopStream, updateCommunity } from "@adda/api-client";
import type { Community } from "@adda/types";
import { hlsBaseUrl } from "@adda/shared";
import { Badge } from "@/ui/badge";
import { Button } from "@/ui/button";
import { Input } from "@/ui/input";
import { Panel, PanelHeader } from "@/ui/panel";
import { LivePlayer } from "@/components/live-player";
import {
  consoleKeys,
  useChannelHealth,
  useChannelRecordings,
  useChannelStatus,
  useChannelMembers,
} from "@/lib/data";

function Tile({ icon: Icon, label, value }: { icon: typeof Eye; label: string; value: string }) {
  return (
    <div className="flex items-center gap-3 rounded-sm border border-line bg-panel px-3 py-3">
      <div className="flex h-8 w-8 items-center justify-center rounded-sm bg-panel2">
        <Icon className="h-4 w-4 text-accent" />
      </div>
      <div>
        <p className="font-num text-lg font-semibold leading-none">{value}</p>
        <p className="mt-0.5 text-2xs uppercase tracking-wider text-muted">{label}</p>
      </div>
    </div>
  );
}

export function CreatorOverview({
  channel,
  onGoStream,
}: {
  channel: Community;
  onGoStream: () => void;
}) {
  const { data: status } = useChannelStatus(channel.id);
  const { data: health } = useChannelHealth(channel.id, true);
  const { data: members = [] } = useChannelMembers(channel.id);
  const { data: recs = [] } = useChannelRecordings(channel.id);
  const qc = useQueryClient();

  const [title, setTitle] = useState(channel.stream_title ?? "");
  const saveTitle = useMutation({
    mutationFn: () => updateCommunity(channel.id, { stream_title: title.trim() || null }),
    onSuccess: () => {
      toast.success("Title saved");
      qc.invalidateQueries({ queryKey: consoleKeys.mine });
    },
    onError: () => toast.error("Could not save the title"),
  });
  const stop = useMutation({
    mutationFn: () => stopStream(channel.id),
    onSuccess: () => {
      toast.success("Stream stopped — publisher disconnected.");
      qc.invalidateQueries({ queryKey: consoleKeys.status(channel.id) });
    },
    onError: (e) => toast.error(e instanceof Error ? e.message : "Could not stop"),
  });

  const isLive = status?.is_live ?? channel.is_live;
  const hlsUrl = `${hlsBaseUrl()}/community/${channel.id}/index.m3u8`;
  const uptime =
    health?.uptime_seconds != null
      ? `${Math.floor(health.uptime_seconds / 3600)}h ${Math.floor((health.uptime_seconds % 3600) / 60)}m`
      : "—";

  return (
    <div className="space-y-4 p-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <h1 className="text-sm font-semibold">{channel.name}</h1>
          <Badge tone="accent">{channel.my_role}</Badge>
          {isLive && (
            <Badge tone="live">
              <span className="h-1 w-1 animate-pulse rounded-full bg-live" /> LIVE
            </Badge>
          )}
        </div>
        <Button variant="primary" size="sm" onClick={onGoStream}>
          <KeyRound className="h-3.5 w-3.5" /> Go live setup
        </Button>
      </div>

      <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
        <Tile icon={Radio} label="Status" value={isLive ? "LIVE" : "Offline"} />
        <Tile icon={Eye} label="Viewers" value={String(status?.viewers ?? 0)} />
        <Tile icon={Heart} label="Followers" value={String(channel.follower_count)} />
        <Tile icon={Users} label="Members" value={String(members.length)} />
      </div>

      {isLive && (
        <Panel>
          <PanelHeader
            title="Live now"
            right={
              <Button
                variant="danger"
                size="xs"
                disabled={stop.isPending}
                onClick={() => stop.mutate()}
              >
                <Square className="h-3 w-3" /> Stop stream
              </Button>
            }
          />
          <div className="p-3">
            <LivePlayer hlsUrl={hlsUrl} />
          </div>
        </Panel>
      )}

      <div className="grid gap-4 lg:grid-cols-2">
        <Panel>
          <PanelHeader title="Stream title" />
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

        <Panel>
          <PanelHeader title="Health" />
          <div className="grid grid-cols-3 gap-2 p-3 text-center">
            <div>
              <p className="font-num text-sm font-semibold">{uptime}</p>
              <p className="text-2xs uppercase tracking-wider text-muted">Uptime</p>
            </div>
            <div>
              <p className="font-num text-sm font-semibold">{health?.video_codec ?? "—"}</p>
              <p className="text-2xs uppercase tracking-wider text-muted">Video</p>
            </div>
            <div>
              <p className="font-num text-sm font-semibold">{health?.audio_codec ?? "—"}</p>
              <p className="text-2xs uppercase tracking-wider text-muted">Audio</p>
            </div>
          </div>
        </Panel>
      </div>

      <Panel>
        <PanelHeader title="Recent recordings" right={<Badge>{recs.length} total</Badge>} />
        <div className="p-3">
          {recs.length === 0 ? (
            <p className="py-4 text-center text-2xs text-muted">
              No recordings yet — they appear here automatically after each stream.
            </p>
          ) : (
            <ul className="space-y-1">
              {recs.slice(0, 4).map((r) => (
                <li key={r.path} className="flex items-center gap-2 text-2xs">
                  <Film className="h-3 w-3 text-muted" />
                  <span className="truncate font-num">{r.name}</span>
                  <span className="ml-auto text-muted">
                    {new Date(r.created_at).toLocaleDateString()}
                  </span>
                </li>
              ))}
            </ul>
          )}
        </div>
      </Panel>
    </div>
  );
}
