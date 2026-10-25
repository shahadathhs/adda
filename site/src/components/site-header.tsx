import Link from "next/link";
import { ExternalLink } from "@/components/external-link";
import { Radio } from "lucide-react";
import { SITE } from "@/lib/site";

const link =
  "shrink-0 rounded-sm px-2 py-1.5 text-sm font-medium sm:px-3 text-muted-foreground transition-colors duration-[120ms] hover:text-foreground";

export function SiteHeader() {
  return (
    <header className="sticky top-0 z-40 border-b border-border bg-background/95">
      <div className="mx-auto flex h-14 max-w-6xl items-center gap-2 px-4 sm:gap-4 sm:px-6">
        <Link href="/" className="flex shrink-0 items-center gap-2" aria-label="adda home">
          <Radio className="h-5 w-5 text-primary" aria-hidden="true" />
          <span className="font-display text-lg font-bold tracking-tight">adda</span>
        </Link>
        <nav className="flex min-w-0 items-center sm:ml-2" aria-label="Primary">
          <Link href="/docs/quickstart" className={link}>
            Docs
          </Link>
          <Link href="/blog" className={link}>
            Blog
          </Link>
          <ExternalLink href={SITE.repo} className={`${link} max-[359px]:hidden`}>
            GitHub
          </ExternalLink>
        </nav>
        <Link
          href="/docs/quickstart"
          className="ml-auto inline-flex h-8 shrink-0 items-center rounded-sm bg-primary px-3 sm:px-3.5 text-sm font-semibold text-primary-foreground transition-colors duration-[120ms] hover:bg-primary-hover"
        >
          Install
        </Link>
      </div>
    </header>
  );
}
