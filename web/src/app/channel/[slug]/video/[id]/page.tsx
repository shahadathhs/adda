import type { Metadata } from "next";
import { notFound } from "next/navigation";
import type { Community } from "@/lib/types";
import { ssrFetch } from "@/lib/ssr";
import { VideoWatch } from "@/components/channel/video-watch";

export const dynamic = "force-dynamic";

export const metadata: Metadata = { title: "Video" };

export default async function VideoPage({
  params,
}: {
  params: Promise<{ slug: string; id: string }>;
}) {
  const { slug, id } = await params;
  const community = await ssrFetch<Community>(`/api/communities/by-slug/${slug}`);
  if (!community) notFound();
  return (
    <main>
      <VideoWatch community={community} videoId={id} />
    </main>
  );
}
