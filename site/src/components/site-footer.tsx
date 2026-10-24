import Link from "next/link";
import { SITE } from "@/lib/site";

export function SiteFooter() {
  return (
    <footer className="border-t border-border">
      <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-4 px-4 py-8 text-sm text-muted-foreground sm:px-6">
        <p>
          adda — <span lang="bn">আড্ডা</span> · live, together, on your own terms
        </p>
        <nav className="flex flex-wrap items-center gap-5" aria-label="Footer">
          <Link href="/docs/quickstart" className="hover:text-foreground">
            Docs
          </Link>
          <Link href="/docs/operations" className="hover:text-foreground">
            Operations
          </Link>
          <a href={`${SITE.repo}/blob/dev/docs/SCOPE.md`} className="hover:text-foreground">
            Scope
          </a>
          <a href={`${SITE.repo}/blob/dev/SECURITY.md`} className="hover:text-foreground">
            Security
          </a>
          <a href={SITE.repo} className="hover:text-foreground">
            GitHub
          </a>
        </nav>
      </div>
    </footer>
  );
}
