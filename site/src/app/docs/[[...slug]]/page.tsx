import type { Metadata } from "next";
import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { DocsSidebar } from "@/components/docs-sidebar";
import { Markdown } from "@/components/mdx";
import { allDocs, getDoc } from "@/lib/content";
import { DOCS_NAV, DOCS_ORDER } from "@/lib/nav";

type Props = { params: Promise<{ slug?: string[] }> };

export function generateStaticParams() {
  return [{ slug: [] }, ...allDocs().map((d) => ({ slug: d.slug }))];
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug = [] } = await params;
  const doc = getDoc(slug);
  return doc ? { title: doc.title, description: doc.description } : {};
}

export default async function DocPage({ params }: Props) {
  const { slug = [] } = await params;
  if (slug.length === 0) redirect("/docs/quickstart");
  const doc = getDoc(slug);
  if (!doc) notFound();

  const key = slug.join("/");
  const at = DOCS_ORDER.indexOf(key);
  const label = (s: string) => DOCS_NAV.flatMap((n) => n.items).find((i) => i.slug === s)?.label;
  const prev = at > 0 ? DOCS_ORDER[at - 1] : null;
  const next = at >= 0 && at < DOCS_ORDER.length - 1 ? DOCS_ORDER[at + 1] : null;

  return (
    <div className="mx-auto grid max-w-6xl gap-10 px-4 py-10 sm:px-6 lg:grid-cols-[14rem_minmax(0,1fr)] xl:grid-cols-[14rem_minmax(0,1fr)_13rem]">
      <aside className="lg:sticky lg:top-20 lg:max-h-[calc(100vh-6rem)] lg:self-start lg:overflow-y-auto">
        <DocsSidebar current={key} />
      </aside>

      <article className="min-w-0">
        <h1 className="font-display text-[34px] font-bold leading-[1.15] tracking-tight">
          {doc.title}
        </h1>
        {doc.description && (
          <p className="mt-2 max-w-2xl text-base leading-7 text-muted-foreground">
            {doc.description}
          </p>
        )}
        <div className="mt-8">
          <Markdown source={doc.body} />
        </div>

        <nav
          aria-label="Previous and next"
          className="mt-14 grid max-w-[46rem] gap-3 border-t border-border pt-6 sm:grid-cols-2"
        >
          {prev ? (
            <Link
              href={`/docs/${prev}`}
              className="rounded-md border border-border px-4 py-3 transition-colors duration-[120ms] hover:bg-card"
            >
              <span className="block text-xs text-muted-foreground">Previous</span>
              <span className="font-medium">{label(prev)}</span>
            </Link>
          ) : (
            <span />
          )}
          {next && (
            <Link
              href={`/docs/${next}`}
              className="rounded-md border border-border px-4 py-3 text-right transition-colors duration-[120ms] hover:bg-card"
            >
              <span className="block text-xs text-muted-foreground">Next</span>
              <span className="font-medium">{label(next)}</span>
            </Link>
          )}
        </nav>
      </article>

      {doc.headings.length > 0 && (
        <aside className="hidden xl:sticky xl:top-20 xl:block xl:self-start">
          <p className="mb-2 text-[11px] font-semibold uppercase tracking-[0.08em] text-muted-foreground">
            On this page
          </p>
          <ul className="space-y-1.5 text-[13px]">
            {doc.headings
              .filter((h) => h.depth === 2)
              .map((h) => (
                <li key={h.id}>
                  <a
                    href={`#${h.id}`}
                    className="text-muted-foreground transition-colors duration-[120ms] hover:text-foreground"
                  >
                    {h.text}
                  </a>
                </li>
              ))}
          </ul>
        </aside>
      )}
    </div>
  );
}
