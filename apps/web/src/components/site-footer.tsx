import Link from "next/link";

export function SiteFooter() {
  return (
    <footer className="border-t border-border">
      <div className="mx-auto flex max-w-7xl flex-wrap items-center justify-between gap-3 px-4 py-5 sm:px-6">
        <p className="text-xs text-muted-foreground">
          adda — <span lang="bn">আড্ডা</span> · live, together, on your own terms
        </p>
        <nav className="flex items-center gap-4 text-xs text-muted-foreground">
          <Link href="/quickstart" className="transition-colors hover:text-foreground">
            Setup guide
          </Link>
          <a
            href="https://github.com/shahadathhs/adda"
            className="transition-colors hover:text-foreground"
          >
            GitHub
          </a>
        </nav>
      </div>
    </footer>
  );
}
