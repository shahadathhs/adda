import type { ReactNode } from "react";

/** A titled panel on the About page, with a link to go further. */
export function AboutCard({
  title,
  href,
  action,
  children,
}: {
  title: string;
  href?: string;
  action?: string;
  children: ReactNode;
}) {
  return (
    <section className="flex flex-col rounded-lg border border-border bg-card p-5">
      <h2 className="font-display text-lg font-semibold tracking-tight text-foreground">{title}</h2>
      <p className="mt-2 flex-1 text-sm leading-5 text-muted-foreground">{children}</p>
      {href && action && (
        <a
          href={href}
          className="mt-4 inline-flex w-fit rounded-sm text-sm font-medium text-primary outline-none hover:underline focus-visible:outline-2 focus-visible:outline-ring"
        >
          {action}
        </a>
      )}
    </section>
  );
}
