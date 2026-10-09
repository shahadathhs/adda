"use client";

import Link from "next/link";
import { UserAvatar } from "@/components/ui/primitives";
import type { DiscoverChannel } from "@adda/types";

/** Compact channel card with banner/monogram art — used on home + /channels. */
export function ChannelCard({ c }: { c: DiscoverChannel }) {
  return (
    <Link
      href={`/channel/${c.slug}`}
      className="group block overflow-hidden rounded-md border border-border bg-card outline-none transition-[translate,box-shadow] duration-120 ease-[var(--ease-micro)] hover:-translate-y-0.5 hover:shadow-[0_4px_12px_rgba(0,0,0,0.5)] focus-visible:outline-2 focus-visible:outline-ring"
    >
      <div className="relative h-20 overflow-hidden bg-[#171b22]">
        {c.banner_url ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={c.banner_url}
            alt=""
            loading="lazy"
            className="h-full w-full object-cover transition-[filter] duration-120 group-hover:brightness-110"
          />
        ) : (
          <div className="flex h-full w-full items-center justify-center">
            <span className="font-display text-2xl font-bold text-muted-foreground/30">
              {c.name.slice(0, 2).toUpperCase()}
            </span>
          </div>
        )}
      </div>
      <div className="-mt-7 flex items-end gap-3 p-3">
        <UserAvatar
          name={c.name}
          src={c.avatar_url}
          className="h-11 w-11 rounded-md text-sm ring-2 ring-card"
        />
        <div className="min-w-0 flex-1 pb-0.5">
          <h3 className="truncate text-sm font-semibold text-foreground">{c.name}</h3>
          <p className="text-xs text-muted-foreground">
            <span className="font-num">{c.follower_count}</span> followers ·{" "}
            <span className="font-num">{c.member_count}</span> members
          </p>
        </div>
      </div>
    </Link>
  );
}
