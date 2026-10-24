"use client";

import { use } from "react";
import { notFound } from "next/navigation";
import { useQueryClient } from "@tanstack/react-query";
import { ChatPanel } from "@/components/chat/chat-panel";
import { ChannelView } from "@/components/channel/channel-view";
import { NotFoundContent } from "@/components/not-found-content";
import { SearchResults } from "@/components/search-results";
import { EndedPanel } from "@/components/channel/ended-panel";
import { HomeClient } from "@/components/home-client";
import { StudioFrame } from "@/components/studio/studio-frame";
import { SetupPage } from "@/components/studio/setup-page";
import { LivePage } from "@/components/studio/live-page";
import { ChannelPage } from "@/components/studio/channel-page";
import { ModeratorsPage } from "@/components/studio/moderators-page";
import { SettingsFrame } from "@/components/settings/settings-frame";
import { StatusCard } from "@/components/settings/status-card";
import { IdentitySection } from "@/components/settings/identity-section";
import { ProfileForm } from "@/components/settings/profile-form";
import { PasswordForm } from "@/components/settings/password-form";
import {
  fixtureChannelRecordings,
  fixtureChannels,
  fixtureChat,
  fixtureEmotes,
  fixturePinned,
  fixturePoll,
  fixtureCreds,
  fixtureFollowers,
  fixtureHealth,
  fixtureModerators,
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
  qc.setQueryData(["discover", ""], fixtureChannels);
  qc.setQueryData(["followers", "c-1"], []);
  qc.setQueryData(webKeys.follow("c-1"), { following: !guest });
  qc.setQueryData(webKeys.recordings("c-1"), fixtureChannelRecordings);

  if (screen === "home")
    return (
      <main>
        <HomeClient initial={fixtureChannels} recordings={fixtureRecordings} />
      </main>
    );

  if (screen === "search")
    return (
      <main>
        <SearchResults initial={fixtureChannels} q="radio" />
      </main>
    );

  if (screen === "not-found") return <NotFoundContent />;

  if (screen === "ended")
    return (
      <main className="mx-auto max-w-3xl p-6">
        <EndedPanel community={fixtureCommunity(false)} seconds={3 * 3600 + 41 * 60} />
      </main>
    );

  if (screen.startsWith("studio-")) {
    const live = screen === "studio-live";
    qc.setQueryData(["mine"], [{ ...fixtureCommunity(live), my_role: "owner" }]);
    qc.setQueryData(webKeys.status("c-1"), fixtureStatus(live));
    qc.setQueryData(["stream-key", "c-1"], fixtureCreds);
    qc.setQueryData(["studio-health", "c-1"], fixtureHealth);
    qc.setQueryData(["moderators", "c-1"], fixtureModerators);
    qc.setQueryData(["followers", "c-1"], fixtureFollowers);
    const pages: Record<string, [string, React.ReactNode]> = {
      "studio-setup": ["/studio", <SetupPage key="s" />],
      "studio-live": ["/studio/live", <LivePage key="l" />],
      "studio-channel": ["/studio/channel", <ChannelPage key="c" />],
      "studio-moderators": ["/studio/moderators", <ModeratorsPage key="m" />],
    };
    const page = pages[screen];
    if (!page) notFound();
    return <StudioFrame current={page[0]}>{page[1]}</StudioFrame>;
  }

  if (screen === "settings-profile")
    return (
      <SettingsFrame current="/settings">
        <div className="grid items-start gap-8 lg:grid-cols-2">
          <section>
            <h2 className="mb-3 font-display text-xl font-semibold tracking-tight">Profile</h2>
            <ProfileForm user={{ ...fixtureUser, bio: "Radio hobbyist. Learning to solder." }} />
          </section>
          <div className="space-y-8">
            <StatusCard user={fixtureUser} />
            <IdentitySection user={fixtureUser} />
            <section>
              <h2 className="mb-3 font-display text-xl font-semibold tracking-tight">Password</h2>
              <PasswordForm />
            </section>
          </div>
        </div>
      </SettingsFrame>
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
              communityId="c-1"
              name="nila_workshop"
              chat={{
                messages: fixtureChat,
                online: 312,
                connected: !screen.includes("lost"),
                loaded: true,
                error: null,
                clearError: noop,
                restriction: null,
                pinned: live ? (fixturePinned as never) : null,
                poll: live ? fixturePoll : null,
                settings: { slow_mode_seconds: 0, followers_only: false },
                emotes: fixtureEmotes,
                send: noop,
                react: noop,
                vote: noop,
              }}
            />
          }
        />
      </main>
    );
  }
  notFound();
}
