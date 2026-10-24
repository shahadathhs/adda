import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Markdown } from "@/components/mdx";
import { allPosts } from "@/lib/content";

type Props = { params: Promise<{ slug: string }> };

export function generateStaticParams() {
  return allPosts().map((p) => ({ slug: p.slug[0] }));
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const post = allPosts().find((p) => p.slug[0] === slug);
  return post ? { title: post.title, description: post.description } : {};
}

export default async function BlogPost({ params }: Props) {
  const { slug } = await params;
  const post = allPosts().find((p) => p.slug[0] === slug);
  if (!post) notFound();
  return (
    <main className="mx-auto max-w-3xl px-4 py-14 sm:px-6">
      <Link href="/blog" className="text-sm text-muted-foreground hover:text-foreground">
        ← Blog
      </Link>
      <p className="mt-6 font-num text-xs text-muted-foreground">{post.date}</p>
      <h1 className="mt-1 font-display text-4xl font-bold leading-tight tracking-tight">
        {post.title}
      </h1>
      <div className="mt-8">
        <Markdown source={post.body} />
      </div>
    </main>
  );
}
