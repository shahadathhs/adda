import type { Metadata } from "next";
import { notFound } from "next/navigation";
import type { Community } from "@/lib/types";
import { ssrFetch } from "@/lib/ssr";
import { RecordingWatch } from "@/components/channel/recording-watch";

export const dynamic = "force-dynamic";

type Props = {
  params: Promise<{ slug: string }>;
  searchParams: Promise<{ path?: string }>;
};

export const metadata: Metadata = { title: "Recording" };

export default async function RecordingPage({ params, searchParams }: Props) {
  const { slug } = await params;
  const { path } = await searchParams;
  const community = await ssrFetch<Community>(`/api/communities/by-slug/${slug}`);
  if (!community || !path) notFound();
  return (
    <main>
      <RecordingWatch community={community} path={path} />
    </main>
  );
}
