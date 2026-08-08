import { useEffect, useState } from "react";
import { useNavigate, useParams } from "@tanstack/react-router";
import { FiVideoOff } from "react-icons/fi";
import { toast } from "sonner";
import { HLS_BASE_URL } from "@/shared/config";
import { UserAvatar } from "@/shared/ui/user-avatar";
import { Button } from "@/shared/ui/button";
import { Card } from "@/shared/ui/card";
import CopyField from "@/shared/ui/CopyField";
import { useMe } from "@/features/auth/hooks";
import {
  useCommunity,
  useJoinCommunity,
  useMembers,
  useRotateStreamKey,
  useStreamKey,
} from "@/features/communities/hooks";
import { useStreamStatus } from "@/features/streaming/hooks";
import LivePlayer from "@/features/streaming/LivePlayer";
import ChatPanel from "@/features/realtime/ChatPanel";
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

export default function CommunityPage() {
  const { id } = useParams({ from: "/_authed/community/$id" });
  const navigate = useNavigate();
  const { data: user } = useMe();
  const [tab, setTab] = useState<Tab>("Live");

  const { data: community, isLoading: loading, isError } = useCommunity(id);
  const isOwner = !!community && !!user && community.owner_id === user.id;
  const { data: creds } = useStreamKey(id, isOwner);
  const { data: status } = useStreamStatus(id, tab === "Live");
  const rotateMutation = useRotateStreamKey(id);
  const { data: members } = useMembers(id);
  const joinMut = useJoinCommunity(id);

  const isLive = status?.is_live ?? community?.is_live ?? false;
  const isMember = members?.some((m) => m.user_id === user?.id) ?? false;

  useEffect(() => {
    if (isError) {
      toast.error("Community not found");
      navigate({ to: "/home" });
    }
  }, [isError, navigate]);

  const rotateKey = () => {
    rotateMutation.mutate(undefined, {
      onSuccess: () => toast.success("Stream key rotated — update OBS with the new URL."),
      onError: () => toast.error("Could not rotate the stream key"),
    });
  };

  if (loading || !community) {
    return <div className="p-6 text-muted-foreground">Loading…</div>;
  }

  const hlsUrl = `${HLS_BASE_URL}/community/${community.id}/index.m3u8`;
  const showPlayer = isLive;

  return (
    <div className="flex h-full flex-col">
      {/* Banner */}
      <div className="h-32 bg-gradient-to-r from-primary/40 to-purple-500/40" />
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
                  <span className="h-1.5 w-1.5 rounded-full bg-red-500" /> LIVE
                </span>
              )}
            </div>
            <p className="text-sm text-muted-foreground">
              {community.description || `@${community.slug}`} · {community.member_count} members
            </p>
          </div>
          {isOwner ? (
            <Button variant="outline" size="sm" disabled>
              Your community
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

        {/* Tabs */}
        <div className="mt-4 flex gap-1 border-b border-border">
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
                {showPlayer ? (
                  <LivePlayer hlsUrl={hlsUrl} />
                ) : (
                  <Card className="flex aspect-video flex-col items-center justify-center gap-3 px-6 text-center">
                    <FiVideoOff className="h-10 w-10 text-muted-foreground/40" />
                    <div className="space-y-1">
                      <p className="text-sm font-medium text-foreground">No live stream</p>
                      <p className="max-w-sm text-xs text-muted-foreground">
                        {isOwner
                          ? 'Start broadcasting in OBS to go live — grab your URL from "Stream setup" below.'
                          : "This community isn't broadcasting right now. Check back soon."}
                      </p>
                    </div>
                  </Card>
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
