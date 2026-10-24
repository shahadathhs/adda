import type { ReactNode } from "react";

/** A labelled form field with optional help text and an inline error under the control. */
export function Field({
  label,
  htmlFor,
  help,
  error,
  children,
  className,
}: {
  label: string;
  htmlFor: string;
  help?: ReactNode;
  error?: string | null;
  children: ReactNode;
  className?: string;
}) {
  return (
    <div className={className}>
      <label htmlFor={htmlFor} className="mb-1.5 block text-sm text-muted-foreground">
        {label}
      </label>
      {children}
      {error ? (
        <p id={`${htmlFor}-msg`} role="alert" className="mt-1.5 text-xs text-destructive">
          {error}
        </p>
      ) : (
        help && (
          <p id={`${htmlFor}-msg`} className="mt-1.5 text-xs text-muted-foreground/80">
            {help}
          </p>
        )
      )}
    </div>
  );
}
