"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Plus } from "lucide-react";
import { toast } from "sonner";
import { createCommunity, listFollowed } from "@/lib/api";
import type { Community, DiscoverChannel, RecordingFeedItem } from "@/lib/types";
import { useLiveGrid } from "@/lib/data";
import { useMe } from "@/lib/session";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { UserAvatar } from "@/components/ui/primitives";
import { StreamCard } from "@/components/stream-card";
import { ChannelCard } from "@/components/channel-card";
import { HomeHero } from "@/components/home-hero";
import { HomeSection } from "@/components/home-section";
import { HomeCta } from "@/components/home-cta";
import { RecordingCard } from "@/components/recording-card";

function FollowingView({ discover }: { discover: DiscoverChannel[] }) {
  const { data: user } = useMe();
  const { data: followed = [] } = useQuery({
    queryKey: ["followed"],
    queryFn: listFollowed,
    enabled: !!user,
  });

  if (!user) {
    return (
      <Card className="flex flex-col items-center gap-3 p-12 text-center">
        <p className="font-display text-xl font-bold tracking-tight">Your follows live here</p>
        <p className="max-w-sm text-sm text-muted-foreground">
          Sign in to follow channels — live streams you care about, in one place.
        </p>
        <Link href="/login">
          <Button variant="primary" size="md">
            Sign in
          </Button>
        </Link>
      </Card>
    );
  }

  const liveMap = new Map(discover.map((d) => [d.community_id, d]));
  const followedLive = followed
    .filter((f) => liveMap.get(f.id)?.is_live)
    .map((f) => liveMap.get(f.id) as DiscoverChannel);

  return (
    <div className="space-y-10">
      <h1 className="font-display text-2xl font-bold tracking-tight">Following</h1>
      <HomeSection
        title="Live from your follows"
        count={followedLive.length}
        empty="None of your channels are live right now."
      >
        <div className="grid grid-cols-[repeat(auto-fill,minmax(260px,1fr))] gap-4">
          {followedLive.map((c) => (
            <StreamCard key={c.community_id} channel={c} />
          ))}
        </div>
      </HomeSection>
      <HomeSection
        title="Channels you follow"
        count={followed.length}
        empty="You don't follow any channels yet — find them under Browse."
      >
        <div className="grid grid-cols-[repeat(auto-fill,minmax(220px,1fr))] gap-4">
          {followed.map((c) => (
            <Link
              key={c.id}
              href={`/channel/${c.slug}`}
              className="flex items-center gap-3 rounded-md border border-border bg-card p-3 outline-none transition-colors duration-120 hover:bg-secondary focus-visible:outline-2 focus-visible:outline-ring"
            >
              <UserAvatar name={c.name} src={c.avatar_url} className="h-10 w-10 text-sm" />
              <span className="min-w-0">
                <span className="block truncate text-sm font-semibold text-foreground">
                  {c.name}
                </span>
                <span className="block truncate text-xs text-muted-foreground">
                  {c.is_live ? "Live" : "Offline"}
                </span>
              </span>
            </Link>
          ))}
        </div>
      </HomeSection>
    </div>
  );
}

export function HomeClient({
  initial,
  recordings,
}: {
  initial: DiscoverChannel[];
  recordings: RecordingFeedItem[];
}) {
  const params = useSearchParams();
  const tab = params.get("tab");
  const q = (params.get("q") ?? "").trim().toLowerCase();

  const channels = useLiveGrid(initial);

  const matches = (s: string | null | undefined) => !q || (s ?? "").toLowerCase().includes(q);

  const visible = channels.filter(
    (c) => matches(c.name) || matches(c.slug) || matches(c.stream_title) || matches(c.description),
  );
  const live = visible.filter((c) => c.is_live).sort((a, b) => b.viewers - a.viewers);
  const trending = [...visible]
    .sort(
      (a, b) =>
        b.follower_count + (b.is_live ? 1000 : 0) - (a.follower_count + (a.is_live ? 1000 : 0)),
    )
    .slice(0, 8);

  const [creating, setCreating] = useState(false);
  const [form, setForm] = useState({ name: "", slug: "", description: "" });
  const qc = useQueryClient();
  const createMut = useMutation({
    mutationFn: (data: Partial<Community> & { name: string; slug: string }) =>
      createCommunity(data),
    onSuccess: () => {
      toast.success("Channel created");
      setCreating(false);
      setForm({ name: "", slug: "", description: "" });
      qc.invalidateQueries();
    },
    onError: (e) => toast.error(e instanceof Error ? e.message : "Failed to create"),
  });

  const visibleRecs = recordings.filter(
    (r) => matches(r.community_name) || matches(r.community_slug) || matches(r.name),
  );

  if (tab === "following") return <FollowingView discover={initial} />;

  return (
    <div className="space-y-10">
      <HomeHero live={live} />

      <HomeSection
        title="Live now"
        count={live.length}
        empty="No one is live right now. Follow channels to get notified the moment they go live."
      >
        <div className="grid grid-cols-[repeat(auto-fill,minmax(260px,1fr))] gap-4">
          {live.map((c) => (
            <StreamCard key={c.community_id} channel={c} />
          ))}
        </div>
      </HomeSection>

      <HomeSection
        title="Trending channels"
        viewAllHref="/channels"
        count={trending.length}
        empty="Channels appear here as the community grows."
      >
        <div className="grid grid-cols-[repeat(auto-fill,minmax(220px,1fr))] gap-4">
          {trending.map((c) => (
            <ChannelCard key={c.community_id} c={c} />
          ))}
        </div>
      </HomeSection>

      <HomeSection
        title="Fresh recordings"
        count={visibleRecs.length}
        empty="Recordings show up here after the first stream ends."
      >
        <div className="grid grid-cols-[repeat(auto-fill,minmax(220px,1fr))] gap-4">
          {visibleRecs.map((r) => (
            <RecordingCard key={r.path} recording={r} />
          ))}
        </div>
      </HomeSection>

      <HomeCta />

      {/* Channel directory — first 8 here, the rest on /channels. */}
      <section className="space-y-4 border-t border-border pt-8">
        <div className="flex items-center justify-between gap-3">
          <h2 className="font-display text-lg font-bold tracking-tight text-foreground">
            All channels
            <span className="ml-2 text-sm font-normal text-muted-foreground">
              <span className="font-num">{visible.length}</span>
            </span>
          </h2>
          <div className="flex items-center gap-2">
            <Button variant="primary" size="sm" onClick={() => setCreating((v) => !v)}>
              <Plus className="h-4 w-4" aria-hidden="true" /> New channel
            </Button>
            <Link href="/channels">
              <Button variant="outline" size="sm">
                View all
              </Button>
            </Link>
          </div>
        </div>

        {creating && (
          <Card className="p-4">
            <form
              className="grid gap-3 sm:grid-cols-2"
              onSubmit={(e) => {
                e.preventDefault();
                createMut.mutate({
                  name: form.name,
                  slug: form.slug,
                  description: form.description || undefined,
                });
              }}
            >
              <Input
                required
                placeholder="Channel name"
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
              />
              <Input
                required
                placeholder="slug (lowercase, hyphens)"
                pattern="[a-z0-9-]+"
                value={form.slug}
                onChange={(e) => setForm({ ...form, slug: e.target.value })}
              />
              <Input
                className="sm:col-span-2"
                placeholder="Description"
                value={form.description}
                onChange={(e) => setForm({ ...form, description: e.target.value })}
              />
              <div className="flex gap-2 sm:col-span-2">
                <Button type="submit" variant="primary" disabled={createMut.isPending}>
                  {createMut.isPending ? "Creating…" : "Create"}
                </Button>
                <Button type="button" variant="ghost" onClick={() => setCreating(false)}>
                  Cancel
                </Button>
              </div>
            </form>
          </Card>
        )}

        <div className="grid grid-cols-[repeat(auto-fill,minmax(220px,1fr))] gap-4">
          {visible.slice(0, 8).map((c) => (
            <ChannelCard key={c.community_id} c={c} />
          ))}
        </div>
        {visible.length === 0 && (
          <p className="text-sm text-muted-foreground">No channels match “{q}”.</p>
        )}
      </section>
    </div>
  );
}
