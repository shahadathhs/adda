import { useRef, useState } from "react";
import { Link } from "@tanstack/react-router";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { Eye, Heart, Plus, Search } from "lucide-react";
import { toast } from "sonner";
import { UserAvatar } from "@/shared/ui/user-avatar";
import { Button } from "@/shared/ui/button";
import { Card } from "@/shared/ui/card";
import { Input } from "@/shared/ui/input";
import { Form, FormControl, FormField, FormItem, FormMessage } from "@/shared/ui/form";
import { useCreateCommunity, useFollowedCommunities } from "@/features/communities/hooks";
import { createCommunitySchema, type CreateCommunityValues } from "@/features/communities/schemas";
import { useDiscover } from "@/features/streaming/hooks";
import type { DiscoverChannel } from "@/features/streaming/api";

function LiveBadge({ viewers }: { viewers: number }) {
  return (
    <span className="flex items-center gap-1 rounded-full bg-red-500/20 px-2 py-0.5 text-xs font-medium text-red-400">
      <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-red-500" /> LIVE
      {viewers > 0 && (
        <>
          <Eye className="ml-1 h-3 w-3" />
          {viewers}
        </>
      )}
    </span>
  );
}

function ChannelThumb({ channel }: { channel: DiscoverChannel }) {
  if (channel.banner_url) {
    return (
      <img
        src={channel.banner_url}
        alt=""
        className="aspect-video w-full object-cover"
        loading="lazy"
      />
    );
  }
  return (
    <div className="flex aspect-video w-full items-center justify-center bg-gradient-to-br from-primary/25 via-muted to-muted">
      <UserAvatar name={channel.name} src={channel.avatar_url} className="h-14 w-14 text-lg" />
    </div>
  );
}

function LiveCard({ channel }: { channel: DiscoverChannel }) {
  return (
    <Link to="/community/$id" params={{ id: channel.community_id }}>
      <Card className="cursor-pointer overflow-hidden transition-colors hover:border-primary">
        <div className="relative">
          <ChannelThumb channel={channel} />
          <div className="absolute left-2 top-2">
            <LiveBadge viewers={channel.viewers} />
          </div>
        </div>
        <div className="flex items-start gap-3 p-3">
          <UserAvatar name={channel.name} src={channel.avatar_url} className="h-9 w-9 text-sm" />
          <div className="min-w-0 flex-1">
            <h3 className="truncate font-semibold">{channel.name}</h3>
            <p className="line-clamp-1 text-sm text-muted-foreground">
              {channel.stream_title || channel.description || `@${channel.slug}`}
            </p>
            <p className="mt-1 flex items-center gap-1 text-xs text-muted-foreground">
              <Heart className="h-3 w-3" /> {channel.follower_count} followers
            </p>
          </div>
        </div>
      </Card>
    </Link>
  );
}

function OfflineCard({ channel }: { channel: DiscoverChannel }) {
  return (
    <Link to="/community/$id" params={{ id: channel.community_id }}>
      <Card className="cursor-pointer p-4 transition-colors hover:border-primary">
        <div className="flex items-start gap-3">
          <div className="relative">
            <UserAvatar
              name={channel.name}
              src={channel.avatar_url}
              className="h-12 w-12 text-base"
            />
            {channel.is_live && (
              <span className="absolute -right-1 -top-1 h-3 w-3 animate-pulse rounded-full bg-red-500 ring-2 ring-background" />
            )}
          </div>
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-2">
              <h3 className="truncate font-semibold">{channel.name}</h3>
            </div>
            <p className="line-clamp-2 text-sm text-muted-foreground">
              {channel.description || `@${channel.slug}`}
            </p>
            <p className="mt-2 text-xs text-muted-foreground">
              {channel.follower_count} followers · {channel.member_count} members
            </p>
          </div>
        </div>
      </Card>
    </Link>
  );
}

export default function HomePage() {
  const [query, setQuery] = useState("");
  const [committed, setCommitted] = useState("");
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const onSearch = (value: string) => {
    setQuery(value);
    if (timer.current) clearTimeout(timer.current);
    timer.current = setTimeout(() => setCommitted(value), 350);
  };

  const { data: channels = [], isLoading: loading } = useDiscover(committed || undefined);
  const { data: followed = [] } = useFollowedCommunities();
  const createMutation = useCreateCommunity();
  const [creating, setCreating] = useState(false);
  const form = useForm<CreateCommunityValues>({
    resolver: zodResolver(createCommunitySchema),
    defaultValues: { name: "", slug: "", description: "" },
  });

  const create = (values: CreateCommunityValues) => {
    createMutation.mutate(values, {
      onSuccess: () => {
        form.reset({ name: "", slug: "", description: "" });
        setCreating(false);
        toast.success("Channel created");
      },
      onError: (err) => toast.error(err instanceof Error ? err.message : "Failed to create"),
    });
  };

  const live = channels.filter((c) => c.is_live);
  const offline = channels.filter((c) => !c.is_live);

  return (
    <div className="mx-auto max-w-6xl p-6">
      <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold">Browse</h1>
          <p className="text-sm text-muted-foreground">
            Live channels, communities, and chat — all self-hosted.
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
            <Plus className="mr-1 h-4 w-4" /> New
          </Button>
        </div>
      </div>

      {creating && (
        <Card className="mb-6 p-4">
          <Form {...form}>
            <form onSubmit={form.handleSubmit(create)} className="grid gap-3 sm:grid-cols-2">
              <FormField
                control={form.control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormControl>
                      <Input placeholder="Channel name" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="slug"
                render={({ field }) => (
                  <FormItem>
                    <FormControl>
                      <Input placeholder="slug (lowercase, hyphens)" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="description"
                render={({ field }) => (
                  <FormItem className="sm:col-span-2">
                    <FormControl>
                      <Input placeholder="Description" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <div className="flex gap-2 sm:col-span-2">
                <Button type="submit">Create</Button>
                <Button type="button" variant="ghost" onClick={() => setCreating(false)}>
                  Cancel
                </Button>
              </div>
            </form>
          </Form>
        </Card>
      )}

      {loading ? (
        <p className="text-muted-foreground">Loading…</p>
      ) : (
        <>
          {followed.length > 0 && (
            <section className="mb-8">
              <h2 className="mb-3 flex items-center gap-2 text-lg font-semibold">
                <Heart className="h-4 w-4 text-red-400" /> Following
              </h2>
              <div className="flex gap-3 overflow-x-auto pb-2">
                {followed.map((c) => (
                  <Link
                    key={c.id}
                    to="/community/$id"
                    params={{ id: c.id }}
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

          <section className="mb-8">
            <h2 className="mb-3 text-lg font-semibold">
              Live now{" "}
              {live.length > 0 && <span className="text-muted-foreground">({live.length})</span>}
            </h2>
            {live.length === 0 ? (
              <Card className="p-8 text-center text-muted-foreground">
                Nobody is streaming right now. Start a stream from OBS — it shows up here instantly.
              </Card>
            ) : (
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {live.map((c) => (
                  <LiveCard key={c.community_id} channel={c} />
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
              <Card className="p-8 text-center text-muted-foreground">No channels found.</Card>
            ) : (
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {offline.map((c) => (
                  <OfflineCard key={c.community_id} channel={c} />
                ))}
              </div>
            )}
          </section>
        </>
      )}
    </div>
  );
}
