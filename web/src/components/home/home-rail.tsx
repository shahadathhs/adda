"use client";

import Link from "next/link";
import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Plus } from "lucide-react";
import { listFollowed } from "@/lib/api";
import type { DiscoverChannel, RecordingFeedItem } from "@/lib/types";
import { useMe } from "@/lib/session";
import { UserAvatar } from "@/components/ui/primitives";
import { CreateChannelForm } from "@/components/home/create-channel-form";
import { recordingTitle } from "@/lib/recordings";
import { cn } from "@/lib/cn";

const eyebrow =
  "px-2 pb-2.5 text-[11px] font-semibold uppercase tracking-[0.08em] text-muted-foreground";

/** Left rail: channels you follow (live first, with viewers) and recent recordings. */
export function HomeRail({
  channels,
  recordings,
}: {
  channels: DiscoverChannel[];
  recordings: RecordingFeedItem[];
}) {
  const { data: user } = useMe();
  const [creating, setCreating] = useState(false);
  const { data: followed, isPending } = useQuery({
    queryKey: ["followed"],
    queryFn: listFollowed,
    enabled: !!user,
  });

  if (!user) return null;

  const byId = new Map(channels.map((c) => [c.community_id, c]));
  const rows = (followed ?? [])
    .map((f) => ({ f, live: byId.get(f.id) }))
    .sort((a, b) => Number(!!b.live?.is_live) - Number(!!a.live?.is_live));
  const followedIds = new Set((followed ?? []).map((f) => f.id));
  const recent = recordings.filter((r) => followedIds.has(r.community_id)).slice(0, 4);

  return (
    <aside
      aria-label="Following"
      className="hidden w-60 shrink-0 border-r border-border px-3 py-5 lg:block"
    >
      <h2 className={eyebrow}>Following</h2>
      {isPending ? (
        <ul className="space-y-1" aria-busy="true" aria-label="Loading followed channels">
          {[0, 1, 2].map((i) => (
            <li key={i} className="h-[42px] animate-pulse rounded-sm bg-secondary/60" />
          ))}
        </ul>
      ) : rows.length === 0 ? (
        <p className="px-2 text-[13px] text-muted-foreground">
          Follow a channel and it shows up here, live ones first.
        </p>
      ) : (
        <ul>
          {rows.map(({ f, live }) => (
            <li key={f.id}>
              <Link
                href={`/channel/${f.slug}`}
                className={cn(
                  "flex items-center gap-2.5 rounded-sm px-2 py-1.5 outline-none transition-colors duration-120 hover:bg-secondary focus-visible:outline-2 focus-visible:outline-ring",
                  !live?.is_live && "opacity-60 hover:opacity-100",
                )}
              >
                <UserAvatar name={f.name} src={f.avatar_url} className="h-7 w-7 text-[11px]" />
                <span className="min-w-0 flex-1 truncate text-sm font-medium text-foreground">
                  {f.name}
                </span>
                {live?.is_live ? (
                  <span className="flex items-center gap-1.5">
                    <span className="h-[7px] w-[7px] rounded-full bg-live" aria-label="Live" />
                    <span className="font-num text-xs text-muted-foreground">
                      {live.viewers.toLocaleString()}
                    </span>
                  </span>
                ) : (
                  <span className="text-xs text-muted-foreground/70">offline</span>
                )}
              </Link>
            </li>
          ))}
        </ul>
      )}

      {recent.length > 0 && (
        <>
          <h2 className={cn(eyebrow, "pt-6")}>Recent recordings</h2>
          <ul className="space-y-3 px-2 text-[13px]">
            {recent.map((r) => (
              <li key={r.path}>
                <Link
                  href={`/channel/${r.community_slug}`}
                  className="block outline-none focus-visible:outline-2 focus-visible:outline-ring"
                >
                  <span className="block truncate font-medium text-foreground">
                    {recordingTitle(r.name)}
                  </span>
                  <span className="block truncate font-num text-xs text-muted-foreground/80">
                    {r.community_name}
                  </span>
                </Link>
              </li>
            ))}
          </ul>
        </>
      )}

      {user && (
        <div className="mt-6 border-t border-border pt-4">
          {creating ? (
            <CreateChannelForm onDone={() => setCreating(false)} />
          ) : (
            <button
              type="button"
              onClick={() => setCreating(true)}
              className="flex w-full items-center gap-2 rounded-sm px-2 py-1.5 text-sm text-muted-foreground transition-colors duration-120 hover:bg-secondary hover:text-foreground focus-visible:outline-2 focus-visible:outline-ring"
            >
              <Plus className="h-4 w-4" aria-hidden="true" />
              Create a channel
            </button>
          )}
        </div>
      )}
    </aside>
  );
}
