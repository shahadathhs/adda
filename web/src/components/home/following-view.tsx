"use client";

import Link from "next/link";
import { useQuery } from "@tanstack/react-query";
import { listFollowed } from "@/lib/api";
import type { DiscoverChannel } from "@/lib/types";
import { useMe } from "@/lib/session";
import { Button } from "@/components/ui/button";
import { HomeSection } from "@/components/home-section";
import { StreamCard } from "@/components/stream-card";

/** `/?tab=following`: live channels you follow, then every channel you follow. */
export function FollowingView({ channels }: { channels: DiscoverChannel[] }) {
  const { data: user } = useMe();
  const { data: followed = [], isPending } = useQuery({
    queryKey: ["followed"],
    queryFn: listFollowed,
    enabled: !!user,
  });

  if (!user) {
    return (
      <section className="flex min-h-[260px] flex-col items-center justify-center gap-3 rounded-lg border border-border bg-card px-6 py-12 text-center">
        <h1 className="font-display text-2xl font-bold tracking-tight text-foreground">
          Your follows live here
        </h1>
        <p className="max-w-sm text-sm text-muted-foreground">
          Sign in to follow channels and see which of them are on air.
        </p>
        <Link href="/login">
          <Button variant="primary">Sign in</Button>
        </Link>
      </section>
    );
  }

  const byId = new Map(channels.map((c) => [c.community_id, c]));
  const mine = followed.flatMap((f) => byId.get(f.id) ?? []);
  const live = mine.filter((c) => c.is_live).sort((a, b) => b.viewers - a.viewers);
  const grid = "grid gap-4 sm:grid-cols-2 xl:grid-cols-4";

  return (
    <>
      <h1 className="font-display text-[28px] font-bold leading-8 tracking-tight text-foreground">
        Following
      </h1>
      <HomeSection
        title="Live now"
        count={live.length}
        empty="None of the channels you follow are live."
      >
        <div className={grid}>
          {live.map((c) => (
            <StreamCard key={c.community_id} channel={c} />
          ))}
        </div>
      </HomeSection>
      <HomeSection
        title="Channels you follow"
        count={isPending ? undefined : mine.length}
        empty="You don't follow anyone yet. Pick a channel from Browse."
      >
        <div className={grid}>
          {mine.map((c) => (
            <StreamCard key={c.community_id} channel={c} />
          ))}
        </div>
      </HomeSection>
    </>
  );
}
