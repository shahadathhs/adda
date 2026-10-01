"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Eye, Heart, KeyRound, Send } from "lucide-react";
import { toast } from "sonner";
import {
  getStreamKey,
  joinCommunity,
  listMembers,
  rotateStreamKey,
  updateCommunity,
} from "@adda/api-client";
import type { ChatMessage, Community, StreamCredentials } from "@adda/types";
import { hlsBaseUrl } from "@adda/shared";
import {
  useCommunityChat,
  useFollow,
  useRecordings,
  useSetFollowed,
  useStreamEvents,
  useStreamStatus,
  webKeys,
} from "@/lib/data";
import { useMe as useMeSession } from "@/lib/session";
import { apiBaseUrl } from "@adda/shared";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { LiveBadge, Meta, UserAvatar } from "@/components/ui/primitives";
import { LivePlayer } from "@/components/live-player";

function ChatRail({ communityId }: { communityId: string }) {
  const { messages, online, send } = useCommunityChat(communityId);
  const [draft, setDraft] = useState("");
  const bottomRef = useRef<HTMLDivElement>(null);
  const { data: user } = useMeSession();

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages.length]);

  return (
    <Card className="flex h-[560px] flex-col overflow-hidden">
      <div className="flex h-10 items-center justify-between border-b border-border px-3">
        <span className="text-sm font-semibold">Chat</span>
        <span className="flex items-center gap-1.5 text-xs text-muted-foreground">
          <span className="h-1.5 w-1.5 rounded-full bg-green-500" /> {online} online
        </span>
      </div>
      <div className="flex-1 space-y-2.5 overflow-y-auto p-3">
        {messages.length === 0 && (
          <p className="py-8 text-center text-xs text-muted-foreground">
            No messages yet — say hi!
          </p>
        )}
        {messages.map((m: ChatMessage) => (
          <div key={m.id} className="flex items-start gap-2">
            <UserAvatar name={m.display_name} className="mt-0.5 h-6 w-6 text-2xs" />
            <p className="min-w-0 text-sm">
              <span
                className={m.user_id === user?.id ? "font-semibold text-primary" : "font-semibold"}
              >
                {m.display_name}
              </span>{" "}
              <span className="text-2xs text-muted-foreground">
                {new Date(m.created_at).toLocaleTimeString([], {
                  hour: "2-digit",
                  minute: "2-digit",
                })}
              </span>
              <br />
              <span className="break-words text-foreground/90">{m.content}</span>
            </p>
          </div>
        ))}
        <div ref={bottomRef} />
      </div>
      {user ? (
        <form
          className="flex gap-2 border-t border-border p-2"
          onSubmit={(e) => {
            e.preventDefault();
            if (draft.trim()) {
              send(draft.trim());
              setDraft("");
            }
          }}
        >
          <Input
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            placeholder="Send a message…"
            className="h-8"
          />
          <Button type="submit" size="sm" disabled={!draft.trim()}>
            <Send className="h-3.5 w-3.5" />
          </Button>
        </form>
      ) : (
        <p className="border-t border-border p-2 text-center text-2xs text-muted-foreground">
          Sign in to join the conversation.
        </p>
      )}
    </Card>
  );
}

function RecordingsSection({ communityId }: { communityId: string }) {
  const { data: user } = useMeSession();
  const { data: recs = [] } = useRecordings(communityId, !!user);
  const [playing, setPlaying] = useState<string | null>(null);

  if (!user) return null;
  return (
    <section className="space-y-3">
      <h2 className="text-lg font-semibold">Recordings</h2>
      {recs.length === 0 ? (
        <Card className="p-6 text-center text-sm text-muted-foreground">No recordings yet.</Card>
      ) : (
        <div className="space-y-2">
          {recs.map((r) => (
            <Card key={r.path} className="p-3">
              <div className="flex items-center justify-between gap-3">
                <div className="min-w-0">
                  <p className="truncate text-sm font-medium">{r.name}</p>
                  <Meta>
                    {new Date(r.created_at).toLocaleString()} · {(r.size_bytes / 1e9).toFixed(2)} GB
                  </Meta>
                </div>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => setPlaying(playing === r.path ? null : r.path)}
                >
                  {playing === r.path ? "Hide" : "Watch"}
                </Button>
              </div>
              {playing === r.path && (
                <video
                  controls
                  autoPlay
                  className="mt-3 w-full rounded-md"
                  src={`${apiBaseUrl()}/api/recordings/file?path=${encodeURIComponent(r.path)}`}
                />
              )}
            </Card>
          ))}
        </div>
      )}
    </section>
  );
}

/** Owner-only: OBS setup — stream URL/key, rotation, live title. */
function StreamSetupCard({ community }: { community: Community }) {
  const qc = useQueryClient();
  const [title, setTitle] = useState(community.stream_title ?? "");
  const { data: creds } = useQuery({
    queryKey: ["stream-key", community.id],
    queryFn: () => getStreamKey(community.id),
  });
  const rotate = useMutation({
    mutationFn: () => rotateStreamKey(community.id),
    onSuccess: (c: StreamCredentials) => {
      qc.setQueryData(["stream-key", community.id], c);
      toast.success("Key rotated — update OBS with the new URL.");
    },
    onError: () => toast.error("Could not rotate the key"),
  });
  const saveTitle = useMutation({
    mutationFn: () => updateCommunity(community.id, { stream_title: title.trim() || null }),
    onSuccess: () => {
      toast.success("Stream title saved");
      qc.invalidateQueries({ queryKey: webKeys.detail(community.id) });
    },
    onError: () => toast.error("Could not save the title"),
  });

  return (
    <Card className="space-y-3 p-4">
      <div className="flex items-center justify-between">
        <h2 className="font-semibold">Stream setup (OBS)</h2>
        <Button
          variant="outline"
          size="sm"
          disabled={rotate.isPending}
          onClick={() => rotate.mutate()}
        >
          <KeyRound className="h-4 w-4" /> Rotate key
        </Button>
      </div>
      <p className="text-xs text-muted-foreground">
        OBS → Settings → Stream → Service: <strong>Custom</strong>, paste the Stream URL as the
        server, leave the Stream Key field empty.
      </p>
      {creds && (
        <>
          <div>
            <Meta className="mb-1">Stream URL (includes your key)</Meta>
            <p className="break-all rounded-md border border-border bg-muted px-2 py-1.5 font-mono text-xs">
              {creds.stream_url}
            </p>
          </div>
          <div className="flex justify-end">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => {
                void navigator.clipboard.writeText(creds.stream_url);
                toast.success("Stream URL copied");
              }}
            >
              Copy URL
            </Button>
          </div>
        </>
      )}
      <div className="flex gap-2 border-t border-border pt-3">
        <Input
          value={title}
          maxLength={200}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="Stream title (shown while live)"
        />
        <Button
          variant="primary"
          size="sm"
          disabled={saveTitle.isPending || title === (community.stream_title ?? "")}
          onClick={() => saveTitle.mutate()}
        >
          Save
        </Button>
      </div>
    </Card>
  );
}

export function ChannelView({ community }: { community: Community }) {
  const { data: user } = useMeSession();
  const qc = useQueryClient();
  const onChange = useCallback(() => {
    qc.invalidateQueries({ queryKey: webKeys.status(community.id) });
    qc.invalidateQueries({ queryKey: webKeys.detail(community.id) });
    qc.invalidateQueries({ queryKey: ["discover"] });
  }, [qc, community.id]);
  useStreamEvents(community.id, onChange);

  const { data: status } = useStreamStatus(community.id);
  const { data: followState } = useFollow(community.id, !!user);
  const { follow, unfollow } = useSetFollowed(community.id);
  const { data: members = [] } = useQuery({
    queryKey: ["members", community.id],
    queryFn: () => listMembers(community.id),
  });

  const isLive = status?.is_live ?? community.is_live;
  const viewers = status?.viewers ?? 0;
  const isMember = members.some((m) => m.user_id === user?.id);
  const isFollowing = followState?.following ?? false;
  const isOwner = user?.id === community.owner_id;

  const joinMut = useMutation({
    mutationFn: () => joinCommunity(community.id),
    onSuccess: (data) =>
      toast.success(data.status === "pending" ? "Join request sent." : "Joined!"),
    onError: (e) => toast.error(e instanceof Error ? e.message : "Failed to join"),
  });

  const hlsUrl = `${hlsBaseUrl()}/community/${community.id}/index.m3u8`;

  return (
    <div>
      {community.banner_url ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={community.banner_url} alt="" className="h-32 w-full rounded-lg object-cover" />
      ) : (
        <div className="h-32 w-full rounded-lg bg-gradient-to-r from-primary/40 to-purple-500/40" />
      )}

      <div className="mt-4 flex flex-wrap items-end gap-4">
        <UserAvatar
          name={community.name}
          src={community.avatar_url}
          className="-mt-10 h-20 w-20 text-2xl ring-4 ring-background"
        />
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <h1 className="text-2xl font-bold">{community.name}</h1>
            {isLive && (
              <span className="flex items-center gap-2">
                <LiveBadge />
                {viewers > 0 && (
                  <span className="flex items-center gap-1 text-xs text-muted-foreground">
                    <Eye className="h-3.5 w-3.5" /> {viewers}
                  </span>
                )}
              </span>
            )}
          </div>
          {community.stream_title && isLive ? (
            <p className="text-sm font-medium">{community.stream_title}</p>
          ) : (
            community.description && (
              <p className="text-sm text-muted-foreground">{community.description}</p>
            )
          )}
          <Meta className="mt-1">
            @{community.slug} · {community.member_count} members · {community.follower_count}{" "}
            followers
          </Meta>
        </div>
        <div className="flex items-center gap-2">
          {user && (
            <Button
              variant={isFollowing ? "default" : "outline"}
              size="sm"
              disabled={follow.isPending || unfollow.isPending}
              onClick={() => (isFollowing ? unfollow.mutate() : follow.mutate())}
            >
              <Heart className={`h-4 w-4 ${isFollowing ? "fill-red-400 text-red-400" : ""}`} />
              {isFollowing ? "Following" : "Follow"}
            </Button>
          )}
          {user ? (
            isMember || community.owner_id === user.id ? (
              <Button variant="ghost" size="sm" disabled>
                {community.owner_id === user.id ? "Your channel" : "Joined"}
              </Button>
            ) : (
              <Button size="sm" disabled={joinMut.isPending} onClick={() => joinMut.mutate()}>
                {joinMut.isPending ? "…" : community.is_private ? "Request to join" : "Join"}
              </Button>
            )
          ) : null}
        </div>
      </div>

      <div className="mt-6 grid gap-4 md:grid-cols-[1fr_320px]">
        <div className="space-y-8">
          {isLive ? (
            <LivePlayer hlsUrl={hlsUrl} />
          ) : (
            <Card className="flex aspect-video flex-col items-center justify-center gap-2 text-center">
              <p className="font-medium">Offline</p>
              <p className="max-w-sm text-sm text-muted-foreground">
                This channel isn&apos;t broadcasting right now. Follow it to catch the next stream.
              </p>
            </Card>
          )}
          {isOwner && <StreamSetupCard community={community} />}
          <RecordingsSection communityId={community.id} />
        </div>
        <ChatRail communityId={community.id} />
      </div>
    </div>
  );
}
