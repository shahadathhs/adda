import Link from "next/link";
import { ExternalLink } from "@/components/external-link";
import { compileMDX } from "next-mdx-remote/rsc";
import rehypeSlug from "rehype-slug";
import remarkGfm from "remark-gfm";
import type { ComponentProps, ReactNode } from "react";

const components = {
  a: ({ href = "", children, ...rest }: ComponentProps<"a">) =>
    href.startsWith("/") ? (
      <Link href={href}>{children}</Link>
    ) : /^https?:\/\//.test(href) ? (
      <ExternalLink href={href} {...rest}>
        {children}
      </ExternalLink>
    ) : (
      <a href={href} {...rest}>
        {children}
      </a>
    ),
  // Wide tables scroll inside their own box instead of stretching the page.
  table: ({ children }: { children?: ReactNode }) => (
    <div className="table-wrap">
      <table>{children}</table>
    </div>
  ),
};

/** Render markdown (with GFM tables) to React, with heading ids for the contents list. */
export async function Markdown({ source }: { source: string }) {
  const { content } = await compileMDX({
    source,
    components,
    options: { mdxOptions: { remarkPlugins: [remarkGfm], rehypePlugins: [rehypeSlug] } },
  });
  return <div className="prose-adda">{content}</div>;
}
