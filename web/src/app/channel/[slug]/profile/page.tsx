import type { Metadata } from "next";
import { notFound } from "next/navigation";
import type { Community } from "@/lib/types";
import { ssrFetch } from "@/lib/ssr";
import { ProfileView } from "@/components/channel/profile-view";

export const dynamic = "force-dynamic";

type Props = { params: Promise<{ slug: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const community = await ssrFetch<Community>(`/api/communities/by-slug/${slug}`, 30);
  return { title: community ? `${community.name} · profile` : "Channel not found" };
}

export default async function ChannelProfilePage({ params }: Props) {
  const { slug } = await params;
  const community = await ssrFetch<Community>(`/api/communities/by-slug/${slug}`);
  if (!community) notFound();
  return (
    <main>
      <ProfileView community={community} />
    </main>
  );
}
