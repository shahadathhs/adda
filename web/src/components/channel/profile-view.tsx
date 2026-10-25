"use client";

import Link from "next/link";
import type { Community } from "@/lib/types";
import { mediaUrl } from "@/lib/media-url";
import { AnnouncementsList } from "@/components/channel/announcements-list";
import { FollowersList } from "@/components/channel/followers-list";
import { LinksList } from "@/components/channel/links-list";
import { FollowButton } from "@/components/home/follow-button";
import { Button } from "@/components/ui/button";
import { UserAvatar } from "@/components/ui/primitives";

const eyebrow = "text-[11px] font-semibold uppercase tracking-[0.08em] text-muted-foreground";

/** A channel's profile: banner, identity, about, links, announcements and followers. */
export function ProfileView({ community }: { community: Community }) {
  const banner = mediaUrl(community.banner_url);
  return (
    <div>
      <div className="h-32 w-full overflow-hidden border-b border-border bg-card sm:h-44">
        {banner && (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={banner} alt="" className="h-full w-full object-cover" />
        )}
      </div>

      <div className="px-4 sm:px-6">
        <div className="-mt-8 flex flex-wrap items-end gap-4">
          <UserAvatar
            name={community.name}
            src={community.avatar_url}
            className="h-20 w-20 border-4 border-background text-2xl"
          />
          <div className="min-w-0 flex-1 pb-1">
            <h1 className="flex items-center gap-2 font-display text-[28px] font-bold leading-8 tracking-tight text-foreground">
              {community.name}
              <span className="rounded-xs bg-primary-subtle px-1.5 text-[10px] font-semibold uppercase leading-[14px] tracking-[0.03em] text-primary">
                Owner
              </span>
            </h1>
            <p className="text-[13px] text-muted-foreground">
              <span className="font-num">{community.follower_count.toLocaleString()}</span>{" "}
              followers
            </p>
          </div>
          <div className="flex gap-2 pb-1">
            <Link href={`/channel/${community.slug}`}>
              <Button variant="outline">{community.is_live ? "Watch live" : "Open channel"}</Button>
            </Link>
            <FollowButton communityId={community.id} solid />
          </div>
        </div>

        <div className="mt-8 grid gap-10 pb-12 lg:grid-cols-[minmax(0,1fr)_340px]">
          <div className="min-w-0 space-y-8">
            <section aria-labelledby="about-h">
              <h2 id="about-h" className={eyebrow}>
                About
              </h2>
              <p className="mt-3 max-w-2xl text-sm leading-relaxed text-foreground">
                {community.description || "This channel has not written an about text yet."}
              </p>
              {!!community.links?.length && (
                <div className="mt-4">
                  <LinksList links={community.links} />
                </div>
              )}
            </section>
            <AnnouncementsList communityId={community.id} />
          </div>
          <section aria-labelledby="followers-h">
            <h2 id="followers-h" className={`mb-3 ${eyebrow}`}>
              Followers
            </h2>
            <FollowersList communityId={community.id} stacked />
          </section>
        </div>
      </div>
    </div>
  );
}
