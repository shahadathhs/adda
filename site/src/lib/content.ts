import { readdirSync, readFileSync } from "node:fs";
import { join } from "node:path";
import matter from "gray-matter";

const ROOT = join(process.cwd(), "content");

export interface Doc {
  slug: string[];
  title: string;
  description: string;
  body: string;
  headings: { id: string; text: string; depth: 2 | 3 }[];
}

export interface Post extends Doc {
  date: string;
  tag: string;
  /** Breaks ties between posts of the same date; lower comes first. */
  order: number;
  /** Thumbnail path under /public, 1200x630. */
  image: string;
  minutes: number;
}

/** The same slug scheme `rehype-slug` uses, so the contents list can link to the headings. */
export function slugify(text: string): string {
  return text
    .toLowerCase()
    .replace(/[`*_]/g, "")
    .replace(/[^\w\s-]/g, "")
    .trim()
    .replace(/\s+/g, "-");
}

function headingsOf(body: string): Doc["headings"] {
  const out: Doc["headings"] = [];
  let fenced = false;
  for (const line of body.split("\n")) {
    if (line.startsWith("```")) fenced = !fenced;
    if (fenced) continue;
    const m = /^(##|###)\s+(.+)$/.exec(line);
    if (m)
      out.push({
        id: slugify(m[2]),
        text: m[2].replace(/[`*_]/g, ""),
        depth: m[1].length as 2 | 3,
      });
  }
  return out;
}

function* walk(dir: string, base: string[] = []): Generator<{ file: string; slug: string[] }> {
  for (const entry of readdirSync(dir, { withFileTypes: true })) {
    if (entry.isDirectory()) yield* walk(join(dir, entry.name), [...base, entry.name]);
    else if (entry.name.endsWith(".md"))
      yield { file: join(dir, entry.name), slug: [...base, entry.name.replace(/\.md$/, "")] };
  }
}

function load(file: string, slug: string[]): Doc & { data: Record<string, unknown> } {
  const { data, content } = matter(readFileSync(file, "utf8"));
  return {
    slug,
    title: String(data.title ?? slug.at(-1)),
    description: String(data.description ?? ""),
    body: content,
    headings: headingsOf(content),
    data,
  };
}

export function allDocs(): Doc[] {
  return [...walk(join(ROOT, "docs"))].map(({ file, slug }) => {
    // `_generated` is a folder for files synced from /docs; it is not part of the URL.
    const clean = slug[0] === "_generated" ? slug.slice(1) : slug;
    return load(file, clean);
  });
}

export function getDoc(slug: string[]): Doc | undefined {
  return allDocs().find((d) => d.slug.join("/") === slug.join("/"));
}

export function allPosts(): Post[] {
  return [...walk(join(ROOT, "blog"))]
    .map(({ file, slug }) => {
      const doc = load(file, slug);
      return {
        ...doc,
        date:
          doc.data.date instanceof Date
            ? doc.data.date.toISOString().slice(0, 10)
            : String(doc.data.date ?? ""),
        tag: String(doc.data.tag ?? "Notes"),
        order: Number(doc.data.order ?? 99),
        image: String(doc.data.image ?? ""),
        minutes: Math.max(1, Math.round(doc.body.split(/\s+/).length / 200)),
      };
    })
    .sort(
      (a, b) =>
        b.date.localeCompare(a.date) || a.order - b.order || a.slug[0].localeCompare(b.slug[0]),
    );
}
