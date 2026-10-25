import Link from "next/link";
import { DOCS_NAV } from "@/lib/nav";

export function DocsSidebar({ current }: { current: string }) {
  return (
    <nav aria-label="Documentation" className="space-y-6 text-sm">
      {DOCS_NAV.map((section) => (
        <div key={section.label}>
          <p className="mb-2 text-[11px] font-semibold uppercase tracking-[0.08em] text-muted-foreground">
            {section.label}
          </p>
          <ul className="space-y-0.5">
            {section.items.map((item) => {
              const on = item.slug === current;
              return (
                <li key={item.slug}>
                  <Link
                    href={`/docs/${item.slug}`}
                    aria-current={on ? "page" : undefined}
                    className={`block rounded-sm px-2.5 py-1.5 transition-colors duration-[120ms] ${
                      on
                        ? "bg-secondary font-medium text-foreground"
                        : "text-muted-foreground hover:text-foreground"
                    }`}
                  >
                    {item.label}
                  </Link>
                </li>
              );
            })}
          </ul>
        </div>
      ))}
    </nav>
  );
}
