import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Markdown } from "@/components/mdx";
import { fmtDate } from "@/components/post-card";
import { allPosts } from "@/lib/content";

type Props = { params: Promise<{ slug: string }> };

export function generateStaticParams() {
  return allPosts().map((p) => ({ slug: p.slug[0] }));
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const post = allPosts().find((p) => p.slug[0] === slug);
  if (!post) return {};
  const png = post.image.replace(/\.svg$/, ".png");
  return {
    title: post.title,
    description: post.description,
    openGraph: {
      type: "article",
      title: post.title,
      description: post.description,
      publishedTime: post.date,
      images: [{ url: png, width: 1200, height: 630 }],
    },
    twitter: { card: "summary_large_image", images: [png] },
  };
}

export default async function BlogPost({ params }: Props) {
  const { slug } = await params;
  const posts = allPosts();
  const post = posts.find((p) => p.slug[0] === slug);
  if (!post) notFound();
  const more = posts.filter((p) => p.slug[0] !== slug).slice(0, 4);

  return (
    <main className="mx-auto max-w-6xl px-4 py-12 sm:px-6">
      <Link href="/blog" className="text-sm text-muted-foreground hover:text-foreground">
        ← Blog
      </Link>
      <header className="mt-6 grid gap-8 lg:grid-cols-[minmax(0,1fr)_minmax(0,26rem)] lg:items-center lg:gap-12">
        <div>
          <p className="flex items-center gap-2 text-xs text-muted-foreground">
            <span className="rounded-xs bg-secondary px-1.5 py-px font-semibold uppercase tracking-wide text-foreground">
              {post.tag}
            </span>
            <span className="font-num">{fmtDate(post.date)}</span>
            <span aria-hidden="true">·</span>
            <span className="font-num">{post.minutes} min read</span>
          </p>
          <h1 className="mt-3 font-display text-4xl font-bold leading-tight tracking-tight sm:text-5xl">
            {post.title}
          </h1>
          <p className="mt-4 text-lg leading-8 text-muted-foreground">{post.description}</p>
        </div>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={post.image}
          alt=""
          width={1200}
          height={630}
          className="aspect-[1200/630] w-full rounded-lg border border-border object-cover"
        />
      </header>

      <div className="mt-12 grid gap-12 lg:grid-cols-[minmax(0,44rem)_minmax(0,1fr)]">
        <article>
          <Markdown source={post.body} />
        </article>
        <aside
          className="space-y-8 lg:sticky lg:top-20 lg:self-start"
          aria-label="Around this post"
        >
          {post.headings.length > 0 && (
            <nav aria-label="On this page">
              <h2 className="text-[11px] font-semibold uppercase tracking-[0.08em] text-muted-foreground">
                On this page
              </h2>
              <ul className="mt-3 space-y-2 text-sm">
                {post.headings
                  .filter((h) => h.depth === 2)
                  .map((h) => (
                    <li key={h.id}>
                      <a
                        href={`#${h.id}`}
                        className="text-muted-foreground transition-colors hover:text-foreground"
                      >
                        {h.text}
                      </a>
                    </li>
                  ))}
              </ul>
            </nav>
          )}
          <nav aria-label="More posts">
            <h2 className="text-[11px] font-semibold uppercase tracking-[0.08em] text-muted-foreground">
              More from the blog
            </h2>
            <ul className="mt-3 space-y-3 text-sm">
              {more.map((p) => (
                <li key={p.slug[0]}>
                  <Link
                    href={`/blog/${p.slug[0]}`}
                    className="block text-foreground transition-colors hover:text-primary"
                  >
                    {p.title}
                  </Link>
                  <span className="font-num text-xs text-muted-foreground">{fmtDate(p.date)}</span>
                </li>
              ))}
            </ul>
          </nav>
        </aside>
      </div>
    </main>
  );
}
