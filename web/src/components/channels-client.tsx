"use client";

import { useState } from "react";
import { Search } from "lucide-react";
import type { DiscoverChannel } from "@/lib/types";
import { Input } from "@/components/ui/input";
import { StreamCard } from "@/components/stream-card";
import { ChannelCard } from "@/components/channel-card";

export function ChannelsClient({ initial }: { initial: DiscoverChannel[] }) {
  const [query, setQuery] = useState("");
  const q = query.trim().toLowerCase();
  const matches = (s: string | null | undefined) => !q || (s ?? "").toLowerCase().includes(q);
  const visible = initial.filter(
    (c) => matches(c.name) || matches(c.slug) || matches(c.stream_title) || matches(c.description),
  );
  const live = visible.filter((c) => c.is_live).sort((a, b) => b.viewers - a.viewers);
  const offline = visible.filter((c) => !c.is_live);

  return (
    <div className="space-y-8">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="font-display text-2xl font-bold tracking-tight text-foreground">
          All channels
          <span className="ml-3 align-middle text-sm font-normal text-muted-foreground">
            <span className="font-num">{initial.length}</span>
          </span>
        </h1>
        <div className="relative w-64 sm:w-80">
          <Search
            className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground"
            aria-hidden="true"
          />
          <Input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search channels…"
            className="pl-9"
            aria-label="Search channels"
          />
        </div>
      </div>

      {visible.length === 0 && (
        <p className="rounded-md border border-border p-10 text-center text-sm text-muted-foreground">
          No channels found.
        </p>
      )}

      {live.length > 0 && (
        <section aria-label="Live channels">
          <h2 className="mb-3 flex items-center gap-2 text-base font-semibold text-foreground">
            <span className="live-dot !h-2 !w-2" aria-hidden="true" />
            Live now
          </h2>
          <div className="grid grid-cols-[repeat(auto-fill,minmax(260px,1fr))] gap-4">
            {live.map((c) => (
              <StreamCard key={c.community_id} channel={c} />
            ))}
          </div>
        </section>
      )}

      {offline.length > 0 && (
        <section aria-label="Offline channels">
          <h2 className="mb-3 text-base font-semibold text-foreground">Channels</h2>
          <div className="grid grid-cols-[repeat(auto-fill,minmax(220px,1fr))] gap-4">
            {offline.map((c) => (
              <ChannelCard key={c.community_id} c={c} />
            ))}
          </div>
        </section>
      )}
    </div>
  );
}
