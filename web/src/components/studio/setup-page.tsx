"use client";

import { SetupPanel } from "@/components/studio/setup-panel";
import { StepsPanel } from "@/components/studio/steps-panel";
import { useStudioChannel } from "@/lib/studio";

export function SetupPage() {
  const { channel } = useStudioChannel();
  if (!channel) return null;
  return (
    <div className="grid gap-6 lg:grid-cols-[minmax(0,1.15fr)_minmax(0,1fr)]">
      <SetupPanel community={channel} />
      <StepsPanel channelId={channel.id} />
    </div>
  );
}
