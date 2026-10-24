"use client";

import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { listFollowed } from "@/lib/api";
import type { DiscoverChannel } from "@/lib/types";
import { useLiveGrid } from "@/lib/data";
import { useMe } from "@/lib/session";
import { ChannelResultCard } from "@/components/channel-result-card";
import { cn } from "@/lib/cn";

type Filter = "all" | "live" | "following";

/** Results for a search (or every channel when the query is empty), with All / Live / Following. */
export function SearchResults({ initial, q }: { initial: DiscoverChannel[]; q: string }) {
  const [filter, setFilter] = useState<Filter>("all");
  const { data: user } = useMe();
  const channels = useLiveGrid(initial);
  const { data: followed } = useQuery({
    queryKey: ["followed"],
    queryFn: listFollowed,
    enabled: !!user,
  });

  const followedIds = new Set((followed ?? []).map((f) => f.id));
  const live = channels.filter((c) => c.is_live).length;
  const shown = channels.filter((c) =>
    filter === "live" ? c.is_live : filter === "following" ? followedIds.has(c.community_id) : true,
  );
  const filters: Filter[] = user ? ["all", "live", "following"] : ["all", "live"];

  return (
    <div className="px-4 py-6 sm:px-6">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="text-[11px] font-semibold uppercase tracking-[0.08em] text-muted-foreground">
            {q ? "Search" : "Browse"}
          </p>
          <h1 className="mt-1 font-display text-[28px] font-bold leading-8 tracking-tight text-foreground">
            {q ? `Channels matching “${q}”` : "All channels"}
          </h1>
          <p className="mt-1 text-[13px] text-muted-foreground">
            <span className="font-num">{channels.length}</span> channel
            {channels.length === 1 ? "" : "s"} · <span className="font-num">{live}</span> live now
          </p>
        </div>
        <div
          role="radiogroup"
          aria-label="Filter results"
          className="inline-flex rounded-md border border-border bg-card p-0.5"
        >
          {filters.map((f) => (
            <button
              key={f}
              type="button"
              role="radio"
              aria-checked={filter === f}
              onClick={() => setFilter(f)}
              className={cn(
                "rounded-sm px-3.5 py-1.5 text-[13px] font-medium capitalize outline-none transition-colors duration-120 focus-visible:outline-2 focus-visible:outline-ring",
                filter === f
                  ? "bg-secondary text-foreground"
                  : "text-muted-foreground hover:text-foreground",
              )}
            >
              {f}
            </button>
          ))}
        </div>
      </div>

      {shown.length === 0 ? (
        <p className="mt-10 text-sm text-muted-foreground">
          {q
            ? `No channel matches “${q}”${filter === "all" ? "." : " with this filter."}`
            : filter === "following"
              ? "You don't follow any channels yet."
              : "No channels here yet."}
        </p>
      ) : (
        <div className="mt-6 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          {shown.map((c) => (
            <ChannelResultCard key={c.community_id} channel={c} />
          ))}
        </div>
      )}
    </div>
  );
}
