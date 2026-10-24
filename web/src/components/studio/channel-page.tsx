"use client";

import { ChannelDetailsForm } from "@/components/studio/channel-details-form";
import { DeleteChannel } from "@/components/studio/delete-channel";
import { useStudioChannel } from "@/lib/studio";

export function ChannelPage() {
  const { channel } = useStudioChannel();
  if (!channel) return null;
  return (
    <div className="max-w-3xl space-y-6">
      <ChannelDetailsForm key={channel.id} community={channel} />
      <DeleteChannel key={`del-${channel.id}`} community={channel} />
    </div>
  );
}
