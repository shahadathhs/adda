import { notFound } from "next/navigation";
import type { Community } from "@adda/types";
import { ssrFetch } from "@/lib/ssr";
import { TopBar } from "@/components/top-bar";
import { ChannelView } from "@/components/channel-view";

export const dynamic = "force-dynamic";

/** Legacy UUID links from the old app → pretty slug URLs. */
export default async function CommunityRedirectPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const community = await ssrFetch<Community>(`/api/communities/${id}`, 60);
  if (!community) notFound();
  return (
    <>
      <TopBar />
      <main className="mx-auto max-w-6xl px-4">
        <ChannelView community={community} />
      </main>
    </>
  );
}
