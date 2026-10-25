import Link from "next/link";
import { ExternalLink } from "@/components/external-link";
import { Radio } from "lucide-react";
import { SITE } from "@/lib/site";

const link =
  "rounded-sm px-3 py-1.5 text-sm font-medium text-muted-foreground transition-colors duration-[120ms] hover:text-foreground";

export function SiteHeader() {
  return (
    <header className="sticky top-0 z-40 border-b border-border bg-background/95">
      <div className="mx-auto flex h-14 max-w-6xl items-center gap-4 px-4 sm:px-6">
        <Link href="/" className="flex items-center gap-2" aria-label="adda home">
          <Radio className="h-5 w-5 text-primary" aria-hidden="true" />
          <span className="font-display text-lg font-bold tracking-tight">adda</span>
        </Link>
        <nav className="ml-2 flex items-center" aria-label="Primary">
          <Link href="/docs/quickstart" className={link}>
            Docs
          </Link>
          <Link href="/blog" className={link}>
            Blog
          </Link>
          <ExternalLink href={SITE.repo} className={link}>
            GitHub
          </ExternalLink>
        </nav>
        <Link
          href="/docs/quickstart"
          className="ml-auto inline-flex h-8 items-center rounded-sm bg-primary px-3.5 text-sm font-semibold text-primary-foreground transition-colors duration-[120ms] hover:bg-primary-hover"
        >
          Install
        </Link>
      </div>
    </header>
  );
}
