import Link from "next/link";
import type { Post } from "@/lib/content";

export const fmtDate = (iso: string) =>
  new Date(`${iso}T00:00:00Z`).toLocaleDateString("en-GB", {
    day: "numeric",
    month: "short",
    year: "numeric",
    timeZone: "UTC",
  });

/** A blog post as a card: thumbnail, tag, date and reading time, title and summary. */
export function PostCard({
  post,
  priority = false,
  featured = false,
}: {
  post: Post;
  priority?: boolean;
  /** The newest post: image beside the text on wide screens. */
  featured?: boolean;
}) {
  return (
    <Link
      href={`/blog/${post.slug[0]}`}
      className={`group flex w-full overflow-hidden rounded-lg border border-border bg-card outline-none transition-[translate,border-color] duration-[120ms] hover:-translate-y-0.5 hover:border-muted-foreground/40 focus-visible:outline-2 focus-visible:outline-ring ${featured ? "flex-col lg:flex-row" : "flex-col"}`}
    >
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={post.image}
        alt=""
        width={1200}
        height={630}
        loading={priority ? "eager" : "lazy"}
        className={`aspect-[1200/630] w-full border-b border-border object-cover ${featured ? "lg:w-[58%] lg:border-b-0 lg:border-r" : ""}`}
      />
      <div className={`flex flex-1 flex-col ${featured ? "justify-center p-6 lg:p-10" : "p-5"}`}>
        <p className="flex items-center gap-2 text-xs text-muted-foreground">
          <span className="rounded-xs bg-secondary px-1.5 py-px font-semibold uppercase tracking-wide text-foreground">
            {post.tag}
          </span>
          <span className="font-num">{fmtDate(post.date)}</span>
          <span aria-hidden="true">·</span>
          <span className="font-num">{post.minutes} min</span>
        </p>
        <h2
          className={`mt-3 font-display font-semibold leading-snug group-hover:text-primary ${featured ? "text-2xl lg:text-3xl" : "text-lg"}`}
        >
          {post.title}
        </h2>
        <p className="mt-2 text-sm leading-6 text-muted-foreground">{post.description}</p>
      </div>
    </Link>
  );
}
