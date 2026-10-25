import type { ComponentProps } from "react";

/** A link to another site: opens in a new tab, without handing that page this one. */
export function ExternalLink({ children, ...props }: ComponentProps<"a">) {
  return (
    <a target="_blank" rel="noopener noreferrer" {...props}>
      {children}
    </a>
  );
}
