"use client";

import { useCallback, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Eye, Heart } from "lucide-react";
import { toast } from "sonner";
import { joinCommunity, listFollowers, listMembers } from "@adda/api-client";
import { hlsBaseUrl } from "@adda/shared";
import type { Community } from "@adda/types";
import { useFollow, useSetFollowed, useStreamEvents, useStreamStatus, webKeys } from "@/lib/data";
import { useMe } from "@/lib/session";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { LiveBadge, UserAvatar } from "@/components/ui/primitives";
import { LivePlayer } from "@/components/live-player";
import { ChatRail } from "@/components/chat-rail";
import { RecordingsSection } from "@/components/recordings-section";
import { TextTabs } from "@/components/page-tabs";

export function ChannelView({ community }: { community: Community }) {
  const [tab, setTab] = useState("home");
  const { data: user } = useMe();
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

  const { data: followers = [] } = useQuery({
    queryKey: ["followers", community.id],
    queryFn: () => listFollowers(community.id),
  });

  const isLive = status?.is_live ?? community.is_live;
  const viewers = status?.viewers ?? 0;
  const isMember = members.some((m) => m.user_id === user?.id);
  const isFollowing = followState?.following ?? false;

  const joinMut = useMutation({
    mutationFn: () => joinCommunity(community.id),
    onSuccess: (data) =>
      toast.success(data.status === "pending" ? "Join request sent." : "Joined!"),
    onError: (e) => toast.error(e instanceof Error ? e.message : "Failed to join"),
  });

  const hlsUrl = `${hlsBaseUrl()}/community/${community.id}/index.m3u8`;

  return (
    <div className="grid items-start gap-4 lg:grid-cols-[1fr_340px]">
      <div className="space-y-5">
        {isLive ? (
          <LivePlayer hlsUrl={hlsUrl} />
        ) : (
          <Card className="flex aspect-video flex-col items-center justify-center gap-2 rounded-lg text-center">
            <p className="font-display text-lg font-semibold">Offline</p>
            <p className="max-w-sm text-sm text-muted-foreground">
              This channel isn&apos;t broadcasting right now. Follow it to catch the next stream.
            </p>
            {!user && (
              <p className="mt-1 text-xs text-muted-foreground">
                Sign in to follow and get notified.
              </p>
            )}
          </Card>
        )}

        <div className="flex flex-wrap items-start gap-4">
          <UserAvatar
            name={community.name}
            src={community.avatar_url}
            className="h-14 w-14 text-lg"
          />
          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap items-center gap-2.5">
              <h1 className="font-display text-xl font-bold tracking-tight">{community.name}</h1>
              {isLive && <LiveBadge />}
              {isLive && viewers > 0 && (
                <span className="inline-flex items-center gap-1 text-xs text-muted-foreground">
                  <Eye className="h-3.5 w-3.5" aria-hidden="true" />
                  <span className="font-num">{viewers}</span>
                </span>
              )}
            </div>
            {isLive && community.stream_title ? (
              <p className="mt-0.5 text-sm font-medium text-foreground">{community.stream_title}</p>
            ) : (
              community.description && (
                <p className="mt-0.5 text-sm text-muted-foreground">{community.description}</p>
              )
            )}
            <p className="mt-1 text-xs text-muted-foreground">
              @{community.slug} · <span className="font-num">{community.member_count}</span> members
              · <span className="font-num">{community.follower_count}</span> followers
            </p>
          </div>
          <div className="flex items-center gap-2">
            {user && (
              <Button
                variant={isFollowing ? "default" : "primary"}
                size="sm"
                disabled={follow.isPending || unfollow.isPending}
                onClick={() => (isFollowing ? unfollow.mutate() : follow.mutate())}
              >
                <Heart
                  className={`h-4 w-4 ${isFollowing ? "fill-live text-live" : ""}`}
                  aria-hidden="true"
                />
                {isFollowing ? "Following" : "Follow"}
              </Button>
            )}
            {user && !isMember && (
              <Button
                variant="outline"
                size="sm"
                disabled={joinMut.isPending}
                onClick={() => joinMut.mutate()}
              >
                {community.is_private ? "Request to join" : "Join"}
              </Button>
            )}
          </div>
        </div>

        {/* Content tabs — Home · Recordings · Followers (About lives in Home). */}
        <TextTabs
          tabs={[
            { id: "home", label: "Home" },
            { id: "recordings", label: "Recordings" },
            { id: "followers", label: "Followers" },
          ]}
          active={tab}
          onChange={setTab}
        />

        {tab === "home" && (
          <Card className="space-y-3 p-5">
            <h2 className="font-display text-base font-bold tracking-tight text-foreground">
              About
            </h2>
            <p className="text-sm leading-relaxed text-muted-foreground">
              {community.description || "No description yet."}
            </p>
            <div className="flex flex-wrap gap-5 border-t border-border pt-3 text-xs text-muted-foreground">
              <span>
                <span className="font-num text-foreground">{community.member_count}</span> members
              </span>
              <span>
                <span className="font-num text-foreground">{community.follower_count}</span>{" "}
                followers
              </span>
            </div>
          </Card>
        )}

        {tab === "recordings" && <RecordingsSection communityId={community.id} />}

        {tab === "followers" && (
          <Card className="p-5">
            {followers.length === 0 ? (
              <p className="text-sm text-muted-foreground">No followers yet — be the first.</p>
            ) : (
              <div className="grid grid-cols-[repeat(auto-fill,minmax(200px,1fr))] gap-3">
                {followers.map((f) => (
                  <div
                    key={f.id}
                    className="flex items-center gap-3 rounded-sm p-2 hover:bg-secondary"
                  >
                    <UserAvatar
                      name={f.display_name}
                      src={f.avatar_url}
                      className="h-9 w-9 text-xs"
                    />
                    <div className="min-w-0">
                      <p className="truncate text-sm font-medium text-foreground">
                        {f.display_name}
                      </p>
                      <p className="truncate text-xs text-muted-foreground">@{f.username}</p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </Card>
        )}
      </div>

      <div className="lg:sticky lg:top-16">
        <ChatRail communityId={community.id} />
      </div>
    </div>
  );
}
