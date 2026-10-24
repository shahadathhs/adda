import type { Metadata } from "next";
import { ssrFetch } from "@/lib/ssr";
import type { DiscoverChannel } from "@/lib/types";
import { SearchResults } from "@/components/search-results";

export const dynamic = "force-dynamic";

export const metadata: Metadata = { title: "Search" };

export default async function SearchPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string }>;
}) {
  const q = ((await searchParams).q ?? "").trim();
  const initial =
    (await ssrFetch<DiscoverChannel[]>(
      `/api/streaming/discover${q ? `?q=${encodeURIComponent(q)}` : ""}`,
    ).catch(() => [])) ?? [];
  return (
    <main>
      <SearchResults key={q} initial={initial} q={q} />
    </main>
  );
}
