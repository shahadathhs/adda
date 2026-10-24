"use client";

import { use } from "react";
import { notFound } from "next/navigation";
import { useQueryClient } from "@tanstack/react-query";
import { ChatPanel } from "@/components/chat/chat-panel";
import { ChannelView } from "@/components/channel/channel-view";
import { HomeClient } from "@/components/home-client";
import {
  fixtureChannelRecordings,
  fixtureChannels,
  fixtureChat,
  fixtureCommunity,
  fixtureFollowed,
  fixtureRecordings,
  fixtureStatus,
  fixtureUser,
} from "@/lib/fixtures";
import { sessionKeys } from "@/lib/session";
import { webKeys } from "@/lib/data";

const noop = () => undefined;

/**
 * Screens rendered with invented data, to compare against the concept renders
 * in docs/design/screens. Development only; production returns 404.
 */
export default function DesignScreen({ params }: { params: Promise<{ screen: string }> }) {
  const { screen } = use(params);
  const qc = useQueryClient();
  if (process.env.NODE_ENV === "production") notFound();

  const guest = screen.endsWith("-guest");
  qc.setQueryData(sessionKeys.me, guest ? null : fixtureUser);
  qc.setQueryData(["followed"], fixtureFollowed);
  qc.setQueryData(["followers", "c-1"], []);
  qc.setQueryData(webKeys.follow("c-1"), { following: !guest });
  qc.setQueryData(webKeys.recordings("c-1"), fixtureChannelRecordings);

  if (screen === "home")
    return (
      <main>
        <HomeClient initial={fixtureChannels} recordings={fixtureRecordings} />
      </main>
    );

  if (screen.startsWith("channel-")) {
    const live = !screen.startsWith("channel-offline");
    qc.setQueryData(webKeys.status("c-1"), fixtureStatus(live));
    return (
      <main>
        <ChannelView
          community={fixtureCommunity(live)}
          chat={
            <ChatPanel
              name="nila_workshop"
              messages={fixtureChat}
              online={312}
              connected={!screen.includes("lost")}
              loaded
              error={null}
              clearError={noop}
              send={noop}
            />
          }
        />
      </main>
    );
  }
  notFound();
}
