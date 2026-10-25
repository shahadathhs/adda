"use client";

import { AnnouncementsCard } from "@/components/studio/announcements-card";
import { BannerCard } from "@/components/studio/banner-card";
import { ChannelDetailsForm } from "@/components/studio/channel-details-form";
import { DeleteChannel } from "@/components/studio/delete-channel";
import { LinksEditor } from "@/components/studio/links-editor";
import { useStudioChannel } from "@/lib/studio";

export function ChannelPage() {
  const { channel } = useStudioChannel();
  if (!channel) return null;
  return (
    <div className="grid items-start gap-6 lg:grid-cols-[minmax(0,1fr)_340px]">
      <div className="space-y-6">
        <ChannelDetailsForm key={channel.id} community={channel} />
        <LinksEditor
          key={`links-${channel.id}-${channel.links?.length ?? 0}`}
          community={channel}
        />
        <DeleteChannel key={`del-${channel.id}`} community={channel} />
      </div>
      <div className="space-y-6">
        <BannerCard community={channel} />
        <AnnouncementsCard communityId={channel.id} />
      </div>
    </div>
  );
}
