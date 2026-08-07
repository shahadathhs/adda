import type { ComponentProps } from "react";
import { Link } from "@tanstack/react-router";
import { Container } from "@/shared/ui/container";

type To = ComponentProps<typeof Link>["to"];
type Item = { label: string; to: To };

const COLUMNS: { title: string; items: Item[] }[] = [
  {
    title: "Product",
    items: [
      { label: "Features", to: "/features" },
      { label: "Pricing", to: "/pricing" },
      { label: "Changelog", to: "/changelog" },
      { label: "Roadmap", to: "/roadmap" },
    ],
  },
  {
    title: "Company",
    items: [
      { label: "About", to: "/about" },
      { label: "Blog", to: "/blog" },
      { label: "Contact", to: "/contact" },
    ],
  },
  {
    title: "Resources",
    items: [
      { label: "Documentation", to: "/docs" },
      { label: "Status", to: "/status" },
    ],
  },
  {
    title: "Legal",
    items: [
      { label: "Privacy", to: "/privacy" },
      { label: "Terms", to: "/terms" },
    ],
  },
];

export function Footer() {
  return (
    <footer className="border-t border-border bg-muted/30">
      <Container className="py-12">
        <div className="grid gap-10 sm:grid-cols-2 md:grid-cols-[1.5fr_repeat(4,1fr)]">
          <div className="space-y-3">
            <Link
              to="/"
              className="bg-gradient-to-r from-primary to-purple-400 bg-clip-text text-xl font-bold text-transparent"
            >
              adda
            </Link>
            <p className="max-w-xs text-sm text-muted-foreground">
              Communities that happen to stream. Live video, chat, and content — all in one place.
            </p>
          </div>

          {COLUMNS.map((col) => (
            <div key={col.title}>
              <h3 className="mb-3 text-sm font-semibold">{col.title}</h3>
              <ul className="space-y-2.5">
                {col.items.map((it) => (
                  <li key={it.label}>
                    <Link
                      to={it.to}
                      className="text-sm text-muted-foreground transition-colors hover:text-foreground"
                    >
                      {it.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        <div className="mt-10 flex flex-col items-center justify-between gap-3 border-t border-border pt-6 text-center sm:flex-row sm:text-left">
          <p className="text-xs text-muted-foreground">
            © {new Date().getFullYear()} adda. All rights reserved.
          </p>
          <p className="text-xs text-muted-foreground">Made for communities.</p>
        </div>
      </Container>
    </footer>
  );
}
