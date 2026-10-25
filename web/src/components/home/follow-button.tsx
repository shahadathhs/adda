"use client";

import Link from "next/link";
import { Check, Heart } from "lucide-react";
import { useFollow, useSetFollowed } from "@/lib/data";
import { useMe } from "@/lib/session";
import { Button } from "@/components/ui/button";

/** Follow toggle. Guests are sent to sign in, since following is a write. */
export function FollowButton({
  communityId,
  solid = false,
}: {
  communityId: string;
  solid?: boolean;
}) {
  const { data: user } = useMe();
  const { data } = useFollow(communityId, !!user);
  const { follow, unfollow } = useSetFollowed(communityId);

  if (!user) {
    return (
      <Link href="/login">
        <Button variant="outline">
          <Heart className="h-3.5 w-3.5" aria-hidden="true" /> Follow
        </Button>
      </Link>
    );
  }
  const following = !!data?.following;
  return (
    <Button
      variant={solid && following ? "primary" : "outline"}
      aria-pressed={following}
      disabled={follow.isPending || unfollow.isPending}
      onClick={() => (following ? unfollow.mutate() : follow.mutate())}
    >
      {following ? (
        <Check className={solid ? "h-3.5 w-3.5" : "h-3.5 w-3.5 text-primary"} aria-hidden="true" />
      ) : (
        <Heart className="h-3.5 w-3.5" aria-hidden="true" />
      )}
      {following ? "Following" : "Follow"}
    </Button>
  );
}
