import Link from "next/link";
import { Radio } from "lucide-react";
import { PageContainer } from "@/components/page-container";
import { PROJECT } from "@/lib/project";

const link =
  "rounded-sm text-sm text-muted-foreground outline-none transition-colors duration-120 hover:text-foreground focus-visible:outline-2 focus-visible:outline-ring";

function Column({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <nav aria-label={title}>
      <h2 className="text-[11px] font-semibold uppercase tracking-[0.08em] text-muted-foreground">
        {title}
      </h2>
      <ul className="mt-3 space-y-2">{children}</ul>
    </nav>
  );
}

/** Brand and what it is, then Watch, Project and Run-your-own links, then the licence line. */
export function SiteFooter() {
  return (
    <footer className="mt-12 border-t border-border bg-card">
      <PageContainer className="px-4 py-10 sm:px-6">
        <div className="grid gap-10 sm:grid-cols-2 lg:grid-cols-[1.4fr_1fr_1fr_1fr]">
          <div>
            <Link href="/" className="inline-flex items-center gap-2" aria-label="adda home">
              <Radio className="h-5 w-5 text-primary" aria-hidden="true" />
              <span className="font-display text-lg font-bold tracking-tight text-foreground">
                adda
              </span>
            </Link>
            <p className="mt-3 max-w-xs text-sm leading-5 text-muted-foreground">
              A live-streaming site you run yourself. Watch, chat, and keep every broadcast.
            </p>
            <p className="mt-3 text-xs text-muted-foreground/80">
              <span lang="bn">আড্ডা</span>: an informal, wide-ranging conversation among friends.
            </p>
          </div>

          <Column title="Watch">
            <li>
              <Link href="/live" className={link}>
                Live now
              </Link>
            </li>
            <li>
              <Link href="/channels" className={link}>
                Channels
              </Link>
            </li>
            <li>
              <Link href="/videos" className={link}>
                Videos
              </Link>
            </li>
            <li>
              <Link href="/recordings" className={link}>
                Recordings
              </Link>
            </li>
            <li>
              <Link href="/search" className={link}>
                Search
              </Link>
            </li>
          </Column>

          <Column title="Project">
            <li>
              <Link href="/about" className={link}>
                About
              </Link>
            </li>
            <li>
              <a href={PROJECT.repo} className={link}>
                Source on GitHub
              </a>
            </li>
            <li>
              <a href={PROJECT.issues} className={link}>
                Report an issue
              </a>
            </li>
            <li>
              <a href={PROJECT.site} className={link}>
                Website
              </a>
            </li>
          </Column>

          <Column title="Run your own">
            <li>
              <a href={PROJECT.docs} className={link}>
                Running a server
              </a>
            </li>
            <li>
              <a href={`${PROJECT.site}/docs`} className={link}>
                Documentation
              </a>
            </li>
            <li>
              <a href={PROJECT.license} className={link}>
                MIT license
              </a>
            </li>
          </Column>
        </div>

        <div className="mt-10 flex flex-wrap items-center justify-between gap-3 border-t border-border pt-5 text-xs text-muted-foreground/80">
          <p>
            Built by{" "}
            <a href={PROJECT.author.url} className="hover:text-foreground">
              {PROJECT.author.handle}
            </a>
            . Open source under the MIT license.
          </p>
          <p>Runs on its host&apos;s own server.</p>
        </div>
      </PageContainer>
    </footer>
  );
}
