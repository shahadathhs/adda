"use client";

import { Suspense, type ReactNode } from "react";
import { RequireAuth } from "@/components/app-shell";
import { ChannelSwitcher } from "@/components/studio/channel-switcher";
import { NoChannel } from "@/components/studio/no-channel";
import { StudioStatus } from "@/components/studio/studio-status";
import { RouteTabs } from "@/components/ui/route-tabs";
import { useStudioChannel } from "@/lib/studio";

const TABS = [
  { href: "/studio", label: "Setup" },
  { href: "/studio/live", label: "Live" },
  { href: "/studio/videos", label: "Videos" },
  { href: "/studio/emotes", label: "Emotes" },
  { href: "/studio/channel", label: "Channel page" },
  { href: "/studio/moderators", label: "Moderators" },
];

function Frame({ children, current }: { children: ReactNode; current?: string }) {
  const { channels, channel, isPending, search } = useStudioChannel();

  if (isPending) {
    return <p className="p-10 text-center text-sm text-muted-foreground">Loading studio…</p>;
  }
  if (!channel) return <NoChannel />;

  return (
    <div className="px-4 py-7 sm:px-6">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <p className="text-[11px] font-semibold uppercase tracking-[0.08em] text-muted-foreground">
            Studio
          </p>
          <h1 className="mt-0.5 font-display text-[28px] font-bold leading-8 tracking-tight text-foreground">
            {channel.name}
          </h1>
          {channels.length > 1 && <ChannelSwitcher channels={channels} current={channel.id} />}
        </div>
        <StudioStatus channelId={channel.id} />
      </div>
      <div className="mb-6 mt-4">
        <RouteTabs label="Studio sections" tabs={TABS} search={search} current={current} />
      </div>
      {children}
    </div>
  );
}

/** Studio chrome: channel title and status, section tabs, then the page. */
export function StudioFrame({ children, current }: { children: ReactNode; current?: string }) {
  return (
    <RequireAuth>
      <Suspense>
        <Frame current={current}>{children}</Frame>
      </Suspense>
    </RequireAuth>
  );
}
