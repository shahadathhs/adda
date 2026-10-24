"use client";

import Link from "next/link";
import { useQuery } from "@tanstack/react-query";
import { streamHealth } from "@/lib/api";
import { hlsBaseUrl } from "@/lib/config";
import { useStudioChannel } from "@/lib/studio";
import { LivePlayer } from "@/components/live-player";
import { ChatModerationCard } from "@/components/studio/chat-moderation-card";
import { PinnedCard } from "@/components/studio/pinned-card";
import { PollForm } from "@/components/studio/poll-form";
import { ChatRail } from "@/components/chat-rail";
import { StatTile } from "@/components/studio/stat-tile";

const uptime = (seconds: number) => {
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  return h > 0 ? `${h}h ${m}m` : `${m}m ${seconds % 60}s`;
};

/** The broadcast monitor and the channel's chat while you are on air. */
export function LivePage() {
  const { channel, search } = useStudioChannel();
  const { data: health, isPending } = useQuery({
    queryKey: ["studio-health", channel?.id],
    queryFn: () => streamHealth(channel!.id),
    enabled: !!channel,
    refetchInterval: 5000,
  });
  if (!channel) return null;

  if (!isPending && !health?.is_live) {
    return (
      <section className="flex min-h-[260px] flex-col items-center justify-center gap-2 rounded-md border border-border bg-card px-6 text-center">
        <h2 className="font-display text-xl font-semibold text-foreground">You are offline</h2>
        <p className="max-w-sm text-sm text-muted-foreground">
          Start your encoder and this page fills with stream health and live chat.{" "}
          <Link href={`/studio${search}`} className="text-primary hover:underline">
            Open setup
          </Link>
        </p>
      </section>
    );
  }

  return (
    <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_340px]">
      <div className="min-w-0 space-y-4">
        <LivePlayer
          hlsUrl={`${hlsBaseUrl()}/community/${channel.id}/index.m3u8`}
          viewers={health?.viewers ?? 0}
        />
        <div className="grid grid-cols-2 gap-4 xl:grid-cols-4">
          <StatTile label="Viewers" value={isPending ? "…" : String(health?.viewers ?? 0)} />
          <StatTile
            label="Uptime"
            value={health?.uptime_seconds != null ? uptime(health.uptime_seconds) : "…"}
          />
          <StatTile label="Video" value={health?.video_codec ?? "…"} />
          <StatTile label="Audio" value={health?.audio_codec ?? "…"} />
        </div>
      </div>
      <div className="min-w-0 space-y-6 lg:col-start-1">
        <PollForm communityId={channel.id} />
        <PinnedCard communityId={channel.id} />
      </div>
      <div className="space-y-4 lg:col-start-2 lg:row-span-2 lg:row-start-1">
        <ChatModerationCard communityId={channel.id} />
        <section
          aria-label="Live chat"
          className="h-[560px] overflow-hidden rounded-md border border-border bg-card"
        >
          <ChatRail communityId={channel.id} name={channel.name} />
        </section>
      </div>
    </div>
  );
}
