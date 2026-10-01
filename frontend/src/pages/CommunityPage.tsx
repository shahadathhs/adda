import { useEffect, useState } from "react";
import { useNavigate, useParams } from "@tanstack/react-router";
import { useQueryClient } from "@tanstack/react-query";
import { Eye, Heart } from "lucide-react";
import { FiVideoOff } from "react-icons/fi";
import { toast } from "sonner";
import { hlsBaseUrl } from "@/shared/config";
import { UserAvatar } from "@/shared/ui/user-avatar";
import { Button } from "@/shared/ui/button";
import { Card } from "@/shared/ui/card";
import { Input } from "@/shared/ui/input";
import CopyField from "@/shared/ui/CopyField";
import { useMe } from "@/features/auth/hooks";
import {
  communitiesKeys,
  useCommunity,
  useFollowState,
  useJoinCommunity,
  useMembers,
  useRotateStreamKey,
  useSetFollowed,
  useStreamKey,
  useUpdateCommunity,
} from "@/features/communities/hooks";
import type { Community } from "@/features/communities/types";
import { useStreamHealth, useStreamStatus } from "@/features/streaming/hooks";
import LivePlayer from "@/features/streaming/LivePlayer";
import ChatPanel from "@/features/realtime/ChatPanel";
import { communityChannel, socket } from "@/features/realtime/ws";
import RecordingsPanel from "@/features/recordings/RecordingsPanel";
import ChannelView from "@/features/channels/ChannelView";
import MembersPanel from "@/features/communities/MembersPanel";

const TABS = ["Live", "Channels", "Posts", "Media", "Files", "Members", "Recordings"] as const;
type Tab = (typeof TABS)[number];

function ComingSoon({ label }: { label: string }) {
  return (
    <Card className="p-10 text-center text-sm text-muted-foreground">
      {label} — coming soon in the next iteration.
    </Card>
  );
}

function formatDuration(seconds: number): string {
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  const s = seconds % 60;
  if (h > 0) return `${h}h ${m}m`;
  if (m > 0) return `${m}m ${s}s`;
  return `${s}s`;
}

function StreamTitleEditor({ id, initial }: { id: string; initial: string | null }) {
  const [title, setTitle] = useState(initial ?? "");
  const update = useUpdateCommunity(id);
  const save = () =>
    update.mutate({ stream_title: title.trim() || null } as Partial<Community>, {
      onSuccess: () => toast.success("Stream title updated"),
      onError: () => toast.error("Could not update the title"),
    });
  return (
    <Card className="flex items-center gap-2 p-3">
      <Input
        value={title}
        onChange={(e) => setTitle(e.target.value)}
        maxLength={200}
        placeholder="What are you streaming today?"
      />
      <Button size="sm" onClick={save} disabled={update.isPending}>
        {update.isPending ? "…" : "Save"}
      </Button>
    </Card>
  );
}

function StatTile({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-lg border border-border p-3 text-center">
      <p className="text-lg font-semibold">{value}</p>
      <p className="text-xs text-muted-foreground">{label}</p>
    </div>
  );
}

function StreamHealthCard({ id }: { id: string }) {
  const { data: health } = useStreamHealth(id, true);
  if (!health) return null;
  return (
    <Card className="space-y-3 p-4">
      <h3 className="text-sm font-semibold">Stream health</h3>
      <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
        <StatTile label="Status" value={health.is_live ? "LIVE" : "Offline"} />
        <StatTile label="Viewers" value={String(health.viewers)} />
        <StatTile
          label="Uptime"
          value={health.uptime_seconds != null ? formatDuration(health.uptime_seconds) : "—"}
        />
        <StatTile
          label="Codecs"
          value={
            health.video_codec || health.audio_codec
              ? `${health.video_codec ?? "?"}/${health.audio_codec ?? "?"}`
              : "—"
          }
        />
      </div>
      {health.started_at && (
        <p className="text-xs text-muted-foreground">
          Started {new Date(health.started_at).toLocaleTimeString()}
        </p>
      )}
    </Card>
  );
}

export default function CommunityPage() {
  const { id } = useParams({ from: "/_authed/community/$id" });
  const navigate = useNavigate();
  const qc = useQueryClient();
  const { data: user } = useMe();
  const [tab, setTab] = useState<Tab>("Live");

  const { data: community, isLoading: loading, isError } = useCommunity(id);
  const isOwner = !!community && !!user && community.owner_id === user.id;
  const { data: creds } = useStreamKey(id, isOwner);
  const { data: status } = useStreamStatus(id, tab === "Live");
  const rotateMutation = useRotateStreamKey(id);
  const { data: members } = useMembers(id);
  const joinMut = useJoinCommunity(id);
  const { data: followState } = useFollowState(id, !!user);
  const { follow, unfollow } = useSetFollowed(id);

  const isFollowing = followState?.following ?? false;
  const isLive = status?.is_live ?? community?.is_live ?? false;
  const isMember = members?.some((m) => m.user_id === user?.id) ?? false;

  useEffect(() => {
    if (isError) {
      toast.error("Channel not found");
      navigate({ to: "/home" });
    }
  }, [isError, navigate]);

  // Realtime live/offline transitions for this community.
  useEffect(() => {
    const topic = communityChannel(id);
    socket.subscribe(topic);
    const off = socket.on((msg) => {
      if (msg.type === "stream_status" && msg.channel === topic) {
        qc.invalidateQueries({ queryKey: ["stream-status", id] });
        qc.invalidateQueries({ queryKey: communitiesKeys.detail(id) });
        qc.invalidateQueries({ queryKey: ["discover"] });
      }
    });
    return () => {
      off();
      socket.unsubscribe(topic);
    };
  }, [id, qc]);

  const rotateKey = () => {
    rotateMutation.mutate(undefined, {
      onSuccess: () => toast.success("Stream key rotated — update OBS with the new URL."),
      onError: () => toast.error("Could not rotate the stream key"),
    });
  };

  const toggleFollow = () => {
    if (isFollowing) {
      unfollow.mutate();
    } else {
      follow.mutate(undefined, {
        onSuccess: () => toast.success("Following — check your Following rail on Browse."),
        onError: (e) => toast.error(e instanceof Error ? e.message : "Failed to follow"),
      });
    }
  };

  if (loading || !community) {
    return <div className="p-6 text-muted-foreground">Loading…</div>;
  }

  const hlsUrl = `${hlsBaseUrl()}/community/${community.id}/index.m3u8`;
  const viewers = status?.viewers ?? 0;

  return (
    <div className="flex h-full flex-col">
      {/* Banner */}
      {community.banner_url ? (
        <img src={community.banner_url} alt="" className="h-32 w-full object-cover" />
      ) : (
        <div className="h-32 bg-gradient-to-r from-primary/40 to-purple-500/40" />
      )}
      <div className="mx-auto w-full max-w-6xl px-6">
        <div className="-mt-10 flex items-end gap-4">
          <UserAvatar
            name={community.name}
            src={community.avatar_url}
            className="h-20 w-20 text-2xl ring-4 ring-background"
          />
          <div className="flex-1 pb-1">
            <div className="flex items-center gap-2">
              <h1 className="text-2xl font-bold">{community.name}</h1>
              {isLive && (
                <span className="flex items-center gap-1 rounded-full bg-red-500/20 px-2 py-0.5 text-xs font-medium text-red-400">
                  <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-red-500" /> LIVE
                </span>
              )}
              {isLive && viewers > 0 && (
                <span className="flex items-center gap-1 text-xs text-muted-foreground">
                  <Eye className="h-3.5 w-3.5" /> {viewers}
                </span>
              )}
            </div>
            {community.stream_title && isLive ? (
              <p className="text-sm font-medium text-foreground/90">{community.stream_title}</p>
            ) : (
              <p className="text-sm text-muted-foreground">
                {community.description || `@${community.slug}`}
              </p>
            )}
            <p className="text-xs text-muted-foreground">
              @{community.slug} · {community.member_count} members · {community.follower_count}{" "}
              followers
            </p>
          </div>
          <div className="flex items-center gap-2 pb-1">
            {!isOwner && (
              <Button
                variant={isFollowing ? "secondary" : "outline"}
                size="sm"
                disabled={follow.isPending || unfollow.isPending}
                onClick={toggleFollow}
              >
                <Heart
                  className={`mr-1 h-4 w-4 ${isFollowing ? "fill-red-400 text-red-400" : ""}`}
                />
                {isFollowing ? "Following" : "Follow"}
              </Button>
            )}
            {isOwner ? (
              <Button variant="outline" size="sm" disabled>
                Your channel
              </Button>
            ) : isMember ? (
              <Button variant="outline" size="sm" disabled>
                Joined
              </Button>
            ) : (
              <Button
                size="sm"
                disabled={joinMut.isPending}
                onClick={() =>
                  joinMut.mutate(undefined, {
                    onSuccess: (data) =>
                      toast.success(
                        data.status === "pending"
                          ? "Join request sent — wait for admin approval."
                          : "Joined!",
                      ),
                    onError: (e) => toast.error(e instanceof Error ? e.message : "Failed to join"),
                  })
                }
              >
                {joinMut.isPending ? "…" : community.is_private ? "Request to join" : "Join"}
              </Button>
            )}
          </div>
        </div>

        {/* Tabs */}
        <div className="mt-4 flex gap-1 overflow-x-auto border-b border-border">
          {TABS.map((t) => (
            <button
              key={t}
              onClick={() => setTab(t)}
              className={`border-b-2 px-4 py-2 text-sm font-medium transition-colors ${
                tab === t
                  ? "border-primary text-primary"
                  : "border-transparent text-muted-foreground hover:text-foreground"
              }`}
            >
              {t}
            </button>
          ))}
        </div>

        {/* Body: content + chat */}
        <div className="grid gap-4 py-4 md:grid-cols-[1fr_320px]">
          <div className="min-h-[400px]">
            {tab === "Live" && (
              <div className="space-y-4">
                {isLive ? (
                  <LivePlayer hlsUrl={hlsUrl} />
                ) : (
                  <Card className="flex aspect-video flex-col items-center justify-center gap-3 px-6 text-center">
                    <FiVideoOff className="h-10 w-10 text-muted-foreground/40" />
                    <div className="space-y-1">
                      <p className="text-sm font-medium text-foreground">Offline</p>
                      <p className="max-w-sm text-xs text-muted-foreground">
                        {isOwner
                          ? 'Start broadcasting in OBS to go live — grab your URL from "Stream setup" below.'
                          : "This channel isn't broadcasting right now. Follow it to catch the next stream."}
                      </p>
                    </div>
                  </Card>
                )}

                {isOwner && (
                  <>
                    <StreamTitleEditor id={community.id} initial={community.stream_title} />
                    <StreamHealthCard id={community.id} />
                  </>
                )}

                {isOwner && creds && (
                  <Card className="space-y-3 p-4">
                    <div className="flex items-center justify-between">
                      <h3 className="text-sm font-semibold">Stream setup (OBS)</h3>
                      <Button variant="outline" size="sm" onClick={rotateKey}>
                        Rotate key
                      </Button>
                    </div>
                    <p className="text-xs text-muted-foreground">
                      Paste the <strong>Stream URL</strong> into OBS → Settings → Stream → Server,
                      and leave the Stream Key field empty.
                    </p>
                    <CopyField label="Stream URL" value={creds.stream_url} />
                    <CopyField label="Stream Key" value={creds.stream_key} />
                  </Card>
                )}
              </div>
            )}
            {tab === "Posts" && <ComingSoon label="Announcements & posts" />}
            {tab === "Channels" && <ChannelView communityId={community.id} canManage={isOwner} />}
            {tab === "Media" && <ComingSoon label="Photo / video gallery" />}
            {tab === "Files" && <ComingSoon label="Shared files" />}
            {tab === "Members" && <MembersPanel communityId={community.id} canManage={isOwner} />}
            {tab === "Recordings" && <RecordingsPanel communityId={community.id} />}
          </div>

          {/* Persistent chat rail */}
          <Card className="h-[600px] overflow-hidden">
            <ChatPanel communityId={community.id} />
          </Card>
        </div>
      </div>
    </div>
  );
}
