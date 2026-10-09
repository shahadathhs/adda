import type { Metadata } from "next";
import { ssrFetch } from "@/lib/ssr";
import type { DiscoverChannel } from "@adda/types";
import { ChannelsClient } from "@/components/channels-client";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "All channels",
  description: "Every channel on this instance.",
};

export default async function ChannelsPage() {
  const initial = (await ssrFetch<DiscoverChannel[]>("/api/streaming/discover")) ?? [];

  return (
    <main className="mx-auto max-w-7xl px-4 py-8 sm:px-6">
      <ChannelsClient initial={initial} />
    </main>
  );
}
