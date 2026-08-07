import { createFileRoute } from "@tanstack/react-router";
import { Check } from "lucide-react";
import { Badge } from "@/shared/ui/badge";
import { Container } from "@/shared/ui/container";
import { PageHeader } from "@/features/site/components/page-header";

export const Route = createFileRoute("/_public/changelog")({
  component: ChangelogPage,
});

const RELEASES = [
  {
    version: "v0.4",
    date: "August 2026",
    tag: "New",
    items: [
      "Public marketing site with pricing, docs, and changelog",
      "Dark mode and theme toggle across the whole app",
      "Faster initial load with per-route code splitting",
    ],
  },
  {
    version: "v0.3",
    date: "July 2026",
    tag: "Improved",
    items: [
      "TanStack Query powers all data fetching with smart caching",
      "Type-safe routing with guarded authenticated areas",
      "Recordings now appear the moment a stream ends",
    ],
  },
  {
    version: "v0.2",
    date: "June 2026",
    tag: "Live",
    items: [
      "Realtime chat with online presence",
      "Stream-key rotation and admin moderation tools",
      "Community roles and membership",
    ],
  },
  {
    version: "v0.1",
    date: "May 2026",
    tag: "Initial",
    items: ["First release: communities, live streaming, and accounts"],
  },
];

function ChangelogPage() {
  return (
    <>
      <PageHeader badge="Product" title="Changelog" subtitle="What's new, every release." />
      <section className="py-16">
        <Container>
          <div className="space-y-10">
            {RELEASES.map((r) => (
              <div
                key={r.version}
                className="grid gap-4 border-l-2 border-border pl-5 sm:grid-cols-[180px_1fr] sm:gap-10 sm:border-l-0 sm:pl-0"
              >
                <div className="border-l-2 border-primary/50 pl-5 sm:pl-6">
                  <div className="text-2xl font-extrabold tracking-tight">{r.version}</div>
                  <div className="mt-1 text-sm text-muted-foreground">{r.date}</div>
                  <Badge variant="secondary" className="mt-2">
                    {r.tag}
                  </Badge>
                </div>
                <ul className="space-y-2.5">
                  {r.items.map((it) => (
                    <li key={it} className="flex items-start gap-2.5 text-sm">
                      <Check className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
                      <span>{it}</span>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </Container>
      </section>
    </>
  );
}
