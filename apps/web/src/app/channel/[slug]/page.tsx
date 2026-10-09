import type { Metadata } from "next";
import { notFound } from "next/navigation";
import type { Community } from "@adda/types";
import { ssrFetch } from "@/lib/ssr";
import { ChannelView } from "@/components/channel-view";

export const dynamic = "force-dynamic";

type Props = { params: Promise<{ slug: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const community = await ssrFetch<Community>(`/api/communities/by-slug/${slug}`, 30);
  if (!community) return { title: "Channel not found" };

  const title = community.is_live
    ? `${community.name} — ${community.stream_title || "LIVE"}`
    : `${community.name} (offline)`;
  const description = community.description ?? `Watch ${community.name} live on adda.`;

  return {
    title,
    description,
    openGraph: {
      title,
      description,
      type: "video.other",
      images: community.banner_url ?? community.avatar_url ?? undefined,
      siteName: "adda",
    },
    twitter: {
      card: community.banner_url ? "summary_large_image" : "summary",
      title,
      description,
    },
  };
}

export default async function ChannelPage({ params }: Props) {
  const { slug } = await params;
  const community = await ssrFetch<Community>(`/api/communities/by-slug/${slug}`);
  if (!community) notFound();

  return (
    <>
      <main className="mx-auto max-w-7xl px-4 py-6 sm:px-6">
        <ChannelView community={community} />
      </main>
    </>
  );
}
