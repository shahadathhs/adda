import type { Metadata } from "next";
import { ssrFetch } from "@/lib/ssr";
import type { DiscoverChannel, RecordingFeedItem } from "@adda/types";
import { HomeClient } from "@/components/home-client";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Live channels",
  description: "Live channels, community chat, and recordings.",
};

export default async function HomePage() {
  const [initial, recent] = await Promise.all([
    ssrFetch<DiscoverChannel[]>("/api/streaming/discover").catch(() => []),
    ssrFetch<RecordingFeedItem[]>("/api/recordings/recent?limit=12").catch(() => []),
  ]);

  return (
    <main className="mx-auto max-w-7xl px-4 py-8 sm:px-6">
      <HomeClient initial={initial ?? []} recordings={recent ?? []} />
    </main>
  );
}
