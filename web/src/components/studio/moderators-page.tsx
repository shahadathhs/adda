"use client";

import { AddModerator } from "@/components/studio/add-moderator";
import { BansPanel } from "@/components/studio/bans-panel";
import { ModeratorsPanel } from "@/components/studio/moderators-panel";
import { useStudioChannel } from "@/lib/studio";

export function ModeratorsPage() {
  const { channel } = useStudioChannel();
  if (!channel) return null;
  return (
    <div className="grid items-start gap-6 lg:grid-cols-[minmax(0,1fr)_340px]">
      <div className="space-y-6">
        <ModeratorsPanel communityId={channel.id} />
        <BansPanel communityId={channel.id} />
      </div>
      <AddModerator communityId={channel.id} />
    </div>
  );
}
