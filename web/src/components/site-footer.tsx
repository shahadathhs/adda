import { PageContainer } from "@/components/page-container";

export function SiteFooter() {
  return (
    <footer className="border-t border-border">
      <PageContainer className="flex flex-wrap items-center justify-between gap-3 px-4 py-5 sm:px-6">
        <p className="text-xs text-muted-foreground">
          adda — <span lang="bn">আড্ডা</span> · live, together, on your own terms
        </p>
        <nav className="flex items-center gap-4 text-xs text-muted-foreground">
          <a
            href="https://github.com/shahadathhs/adda/blob/dev/docs/OPERATIONS.md"
            className="transition-colors hover:text-foreground"
          >
            Running a server
          </a>
          <a
            href="https://github.com/shahadathhs/adda"
            className="transition-colors hover:text-foreground"
          >
            GitHub
          </a>
        </nav>
      </PageContainer>
    </footer>
  );
}
