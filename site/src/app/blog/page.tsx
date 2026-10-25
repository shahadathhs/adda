import type { Metadata } from "next";
import { Reveal } from "@/components/reveal";
import { PostCard } from "@/components/post-card";
import { allPosts } from "@/lib/content";

export const metadata: Metadata = {
  title: "Blog",
  description: "Notes on how adda is built: streaming, chat, operations and design.",
};

export default function BlogIndex() {
  const [latest, ...rest] = allPosts();
  return (
    <main className="mx-auto max-w-6xl px-4 py-14 sm:px-6">
      <p className="text-[11px] font-semibold uppercase tracking-[0.08em] text-muted-foreground">
        Blog
      </p>
      <h1 className="mt-2 font-display text-4xl font-bold tracking-tight sm:text-5xl">
        How adda is built.
      </h1>
      <p className="mt-3 max-w-2xl text-lg leading-8 text-muted-foreground">
        Notes from the people who run it: the streaming path, chat, operations and the design rules,
        with what is measured and what is not.
      </p>

      {latest && (
        <div className="mt-10">
          <PostCard post={latest} priority featured />
        </div>
      )}

      <ul className="mt-8 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
        {rest.map((p, i) => (
          <li key={p.slug.join("/")} className="flex">
            <Reveal className="flex w-full" delay={(i % 3) * 35}>
              <PostCard post={p} />
            </Reveal>
          </li>
        ))}
      </ul>
    </main>
  );
}
