"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useDiscover } from "@/lib/data";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { StreamCard } from "@/components/stream-card";

/** The 404 page: say what happened, offer a search, and show who is live as a way out. */
export function NotFoundContent() {
  const router = useRouter();
  const { data } = useDiscover();
  const live = (data ?? [])
    .filter((c) => c.is_live)
    .sort((a, b) => b.viewers - a.viewers)
    .slice(0, 3);

  return (
    <main className="mx-auto max-w-[832px] px-4 py-16 sm:px-6 sm:py-20">
      <p className="text-[11px] font-semibold uppercase tracking-[0.08em] text-muted-foreground">
        Not found
      </p>
      <h1 className="mt-2 font-display text-[40px] font-bold leading-[44px] tracking-tight text-foreground">
        There&apos;s nothing at that address.
      </h1>
      <p className="mt-4 max-w-xl text-sm leading-5 text-muted-foreground">
        The link may have a typo, or the channel was renamed or deleted by its owner. Try a search,
        or have a look at who is live right now.
      </p>
      <form
        role="search"
        className="mt-6 flex max-w-xl flex-wrap gap-2"
        onSubmit={(e) => {
          e.preventDefault();
          const q = String(new FormData(e.currentTarget).get("q") ?? "").trim();
          router.push(q ? `/search?q=${encodeURIComponent(q)}` : "/search");
        }}
      >
        <Input
          name="q"
          placeholder="Search channels…"
          aria-label="Search channels"
          className="min-w-0 flex-1 sm:max-w-[360px]"
        />
        <Button type="submit" variant="primary">
          Search
        </Button>
        <Link href="/search">
          <Button type="button" variant="outline">
            Browse everything
          </Button>
        </Link>
      </form>

      {live.length > 0 && (
        <section className="mt-14" aria-labelledby="nf-live">
          <h2
            id="nf-live"
            className="mb-3.5 text-[11px] font-semibold uppercase tracking-[0.08em] text-muted-foreground"
          >
            Live now
          </h2>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {live.map((c) => (
              <StreamCard key={c.community_id} channel={c} />
            ))}
          </div>
        </section>
      )}
    </main>
  );
}
