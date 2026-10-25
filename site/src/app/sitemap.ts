import type { MetadataRoute } from "next";
import { allDocs, allPosts } from "@/lib/content";
import { SITE } from "@/lib/site";

export const dynamic = "force-static";

export default function sitemap(): MetadataRoute.Sitemap {
  const urls = [
    "",
    "/blog",
    ...allDocs().map((d) => `/docs/${d.slug.join("/")}`),
    ...allPosts().map((p) => `/blog/${p.slug[0]}`),
  ];
  return urls.map((path) => ({ url: `${SITE.url}${path}` }));
}
