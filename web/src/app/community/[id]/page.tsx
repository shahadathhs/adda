import { notFound, redirect } from "next/navigation";
import type { Community } from "@/lib/types";
import { ssrFetch } from "@/lib/ssr";

export const dynamic = "force-dynamic";

/** Old UUID links land on the channel's page. */
export default async function LegacyCommunityPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const community = await ssrFetch<Community>(`/api/communities/${id}`, 60);
  if (!community) notFound();
  redirect(`/channel/${community.slug}`);
}
