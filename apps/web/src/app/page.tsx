import type { Metadata } from "next";
import { ssrFetch } from "@/lib/ssr";
import type { DiscoverChannel } from "@adda/types";
import { TopBar } from "@/components/top-bar";
import { BrowseClient } from "@/components/browse-client";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Browse live channels",
  description: "Live channels and communities on this adda instance.",
};

export default async function BrowsePage() {
  const initial = (await ssrFetch<DiscoverChannel[]>("/api/streaming/discover")) ?? [];

  return (
    <>
      <TopBar />
      <main className="mx-auto max-w-6xl px-4 py-6">
        <BrowseClient initial={initial} />
      </main>
    </>
  );
}
