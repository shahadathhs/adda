"use client";

import Link from "next/link";
import { useRef, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Eye, Heart, Plus, Search } from "lucide-react";
import { toast } from "sonner";
import { createCommunity, listFollowed } from "@adda/api-client";
import type { Community, DiscoverChannel } from "@adda/types";
import { useDiscover, webKeys } from "@/lib/data";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { LiveBadge, Meta, UserAvatar } from "@/components/ui/primitives";

function LiveCard({ c }: { c: DiscoverChannel }) {
  return (
    <Link href={`/channel/${c.slug}`}>
      <Card className="cursor-pointer overflow-hidden transition-colors hover:border-primary">
        <div className="relative">
          {c.banner_url ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={c.banner_url} alt="" className="aspect-video w-full object-cover" />
          ) : (
            <div className="flex aspect-video w-full items-center justify-center bg-gradient-to-br from-primary/25 via-muted to-muted">
              <UserAvatar name={c.name} src={c.avatar_url} className="h-14 w-14 text-lg" />
            </div>
          )}
          <div className="absolute left-2 top-2">
            <LiveBadge viewers={c.viewers} />
          </div>
        </div>
        <div className="flex items-start gap-3 p-3">
          <UserAvatar name={c.name} src={c.avatar_url} className="h-9 w-9 text-sm" />
          <div className="min-w-0 flex-1">
            <h3 className="truncate font-semibold">{c.name}</h3>
            <p className="line-clamp-1 text-sm text-muted-foreground">
              {c.stream_title || c.description || `@${c.slug}`}
            </p>
            <Meta className="mt-1 flex items-center gap-1">
              <Eye className="h-3 w-3" /> {c.viewers} watching
            </Meta>
          </div>
        </div>
      </Card>
    </Link>
  );
}

function ChannelCard({ c }: { c: DiscoverChannel }) {
  return (
    <Link href={`/channel/${c.slug}`}>
      <Card className="cursor-pointer p-4 transition-colors hover:border-primary">
        <div className="flex items-start gap-3">
          <div className="relative">
            <UserAvatar name={c.name} src={c.avatar_url} className="h-12 w-12 text-base" />
            {c.is_live && (
              <span className="absolute -right-1 -top-1 h-3 w-3 animate-pulse rounded-full bg-red-500 ring-2 ring-background" />
            )}
          </div>
          <div className="min-w-0 flex-1">
            <h3 className="truncate font-semibold">{c.name}</h3>
            <p className="line-clamp-2 text-sm text-muted-foreground">
              {c.description || `@${c.slug}`}
            </p>
            <Meta className="mt-2">
              <span className="inline-flex items-center gap-1">
                <Heart className="h-3 w-3" /> {c.follower_count}
              </span>{" "}
              · {c.member_count} members
            </Meta>
          </div>
        </div>
      </Card>
    </Link>
  );
}

export function BrowseClient({ initial }: { initial: DiscoverChannel[] }) {
  const [query, setQuery] = useState("");
  const [committed, setCommitted] = useState("");
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const onSearch = (value: string) => {
    setQuery(value);
    if (timer.current) clearTimeout(timer.current);
    timer.current = setTimeout(() => setCommitted(value), 350);
  };

  const searching = committed !== "";
  const { data: searched } = useDiscover(searching ? committed : undefined);
  const { data: followed = [] } = useQuery({
    queryKey: webKeys.followed,
    queryFn: listFollowed,
  });
  const channels = searching ? (searched ?? []) : initial;

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
      qc.invalidateQueries({ queryKey: ["discover"] });
    },
    onError: (e) => toast.error(e instanceof Error ? e.message : "Failed to create"),
  });

  const live = channels.filter((c) => c.is_live);
  const offline = channels.filter((c) => !c.is_live);

  return (
    <div className="space-y-8">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold">Browse</h1>
          <p className="text-sm text-muted-foreground">
            Live channels and communities — all self-hosted.
          </p>
        </div>
        <div className="flex flex-1 items-center justify-end gap-2">
          <div className="relative w-full max-w-xs">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              value={query}
              onChange={(e) => onSearch(e.target.value)}
              placeholder="Search channels…"
              className="pl-9"
            />
          </div>
          <Button onClick={() => setCreating((v) => !v)}>
            <Plus className="h-4 w-4" /> New
          </Button>
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
              <Button type="submit" disabled={createMut.isPending}>
                {createMut.isPending ? "Creating…" : "Create"}
              </Button>
              <Button type="button" variant="ghost" onClick={() => setCreating(false)}>
                Cancel
              </Button>
            </div>
          </form>
        </Card>
      )}

      {searching ? (
        <section>
          <h2 className="mb-3 text-lg font-semibold">
            Results <span className="text-muted-foreground">({channels.length})</span>
          </h2>
          {channels.length === 0 ? (
            <Card className="p-8 text-center text-muted-foreground">No channels found.</Card>
          ) : (
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {channels.map((c) =>
                c.is_live ? (
                  <LiveCard key={c.community_id} c={c} />
                ) : (
                  <ChannelCard key={c.community_id} c={c} />
                ),
              )}
            </div>
          )}
        </section>
      ) : (
        <>
          {followed.length > 0 && (
            <section>
              <h2 className="mb-3 flex items-center gap-2 text-lg font-semibold">
                <Heart className="h-4 w-4 text-red-400" /> Following
              </h2>
              <div className="flex gap-3 overflow-x-auto pb-2">
                {followed.map((c) => (
                  <Link
                    key={c.id}
                    href={`/channel/${c.slug}`}
                    className="flex w-40 shrink-0 flex-col items-center gap-2 rounded-lg border border-border p-3 text-center transition-colors hover:border-primary"
                  >
                    <div className="relative">
                      <UserAvatar name={c.name} src={c.avatar_url} className="h-12 w-12" />
                      {c.is_live && (
                        <span className="absolute -right-1 -top-1 h-3 w-3 animate-pulse rounded-full bg-red-500 ring-2 ring-background" />
                      )}
                    </div>
                    <span className="w-full truncate text-sm font-medium">{c.name}</span>
                    <span className="text-xs text-muted-foreground">
                      {c.is_live ? "Live now" : "Offline"}
                    </span>
                  </Link>
                ))}
              </div>
            </section>
          )}

          <section>
            <h2 className="mb-3 text-lg font-semibold">
              Live now{" "}
              {live.length > 0 && <span className="text-muted-foreground">({live.length})</span>}
            </h2>
            {live.length === 0 ? (
              <Card className="p-8 text-center text-muted-foreground">
                Nobody is streaming right now — check back soon.
              </Card>
            ) : (
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {live.map((c) => (
                  <LiveCard key={c.community_id} c={c} />
                ))}
              </div>
            )}
          </section>

          <section>
            <h2 className="mb-3 text-lg font-semibold">
              All channels{" "}
              {offline.length > 0 && (
                <span className="text-muted-foreground">({offline.length})</span>
              )}
            </h2>
            {offline.length === 0 ? (
              <Card className="p-8 text-center text-muted-foreground">No channels yet.</Card>
            ) : (
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {offline.map((c) => (
                  <ChannelCard key={c.community_id} c={c} />
                ))}
              </div>
            )}
          </section>
        </>
      )}
    </div>
  );
}
