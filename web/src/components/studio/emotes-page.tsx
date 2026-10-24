"use client";

import { EmoteGrid } from "@/components/studio/emote-grid";
import { EmoteUpload } from "@/components/studio/emote-upload";
import { useStudioChannel } from "@/lib/studio";

export function EmotesPage() {
  const { channel } = useStudioChannel();
  if (!channel) return null;
  return (
    <div className="grid items-start gap-6 lg:grid-cols-[minmax(0,1fr)_340px]">
      <EmoteGrid communityId={channel.id} />
      <EmoteUpload communityId={channel.id} />
    </div>
  );
}
