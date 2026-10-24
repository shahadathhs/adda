import type { Community } from "@/lib/types";
import { UserAvatar } from "@/components/ui/primitives";
import { Elapsed } from "@/components/elapsed";
import { FollowButton } from "@/components/home/follow-button";

/** Title row under the player: avatar, stream title, channel meta and the follow control. */
export function ChannelHeader({
  community,
  isLive,
  startedAt,
}: {
  community: Community;
  isLive: boolean;
  startedAt: string | null;
}) {
  return (
    <div className="flex flex-wrap items-center gap-3.5">
      <UserAvatar
        name={community.name}
        src={community.avatar_url}
        className="h-12 w-12 text-base"
      />
      <div className="min-w-0 flex-1">
        <h1 className="line-clamp-2 font-display text-xl font-semibold leading-7 tracking-tight text-foreground">
          {(isLive && community.stream_title) || community.name}
        </h1>
        <p className="text-[13px] text-muted-foreground">
          {isLive && (
            <>
              <span className="font-semibold text-foreground">{community.name}</span>
              {" · "}
            </>
          )}
          <span className="font-num">{community.follower_count.toLocaleString()}</span> followers
          {isLive && startedAt && (
            <>
              {" · live for "}
              <Elapsed since={startedAt} />
            </>
          )}
        </p>
      </div>
      <FollowButton communityId={community.id} solid />
    </div>
  );
}
