import { Container } from "@/shared/ui/container";

export interface DocSection {
  id: string;
  title: string;
  body: string;
}

/**
 * Two-column prose layout: a sticky table of contents on the left and the
 * content on the right. Together they fill the 1024px container, and the
 * content column stays a readable measure instead of being squashed into a
 * narrow centered block.
 */
export function DocLayout({ intro, sections }: { intro?: string; sections: DocSection[] }) {
  return (
    <Container className="py-14">
      <div className="grid gap-10 md:grid-cols-[220px_1fr]">
        <aside className="hidden md:block">
          <nav className="sticky top-24 space-y-1">
            <p className="mb-3 px-3 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
              On this page
            </p>
            {sections.map((s) => (
              <a
                key={s.id}
                href={`#${s.id}`}
                className="block rounded-md px-3 py-1.5 text-sm text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
              >
                {s.title}
              </a>
            ))}
          </nav>
        </aside>

        <article className="max-w-3xl">
          {intro && <p className="mb-10 text-sm text-muted-foreground">{intro}</p>}
          <div className="space-y-10">
            {sections.map((s) => (
              <section key={s.id} id={s.id} className="scroll-mt-24">
                <h2 className="text-xl font-semibold">{s.title}</h2>
                <p className="mt-2 leading-relaxed text-muted-foreground">{s.body}</p>
              </section>
            ))}
          </div>
        </article>
      </div>
    </Container>
  );
}
