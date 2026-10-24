import type { Metadata } from "next";
import Link from "next/link";
import { allPosts } from "@/lib/content";

export const metadata: Metadata = {
  title: "Blog",
  description: "Notes on how adda is built.",
};

export default function BlogIndex() {
  const posts = allPosts();
  return (
    <main className="mx-auto max-w-3xl px-4 py-14 sm:px-6">
      <h1 className="font-display text-4xl font-bold tracking-tight">Blog</h1>
      <p className="mt-2 text-muted-foreground">Notes on how adda is built.</p>
      <ul className="mt-10 divide-y divide-border border-y border-border">
        {posts.map((p) => (
          <li key={p.slug.join("/")}>
            <Link href={`/blog/${p.slug[0]}`} className="group block py-6">
              <p className="font-num text-xs text-muted-foreground">{p.date}</p>
              <h2 className="mt-1 font-display text-xl font-semibold group-hover:text-primary">
                {p.title}
              </h2>
              <p className="mt-1.5 text-sm leading-6 text-muted-foreground">{p.description}</p>
            </Link>
          </li>
        ))}
      </ul>
    </main>
  );
}
