"use client";

import { useState } from "react";
import { Check, Copy } from "lucide-react";

/** The one-line installer, with a copy button that says what it did. */
export function InstallCommand({ command }: { command: string }) {
  const [copied, setCopied] = useState(false);
  return (
    <div className="flex items-center gap-2 rounded-md border border-border bg-card py-1.5 pl-4 pr-1.5">
      <span className="select-none text-muted-foreground" aria-hidden="true">
        $
      </span>
      <code className="min-w-0 flex-1 break-all font-num text-[13px] leading-5 text-foreground">
        {command}
      </code>
      <button
        type="button"
        onClick={() => {
          void navigator.clipboard.writeText(command).then(() => {
            setCopied(true);
            setTimeout(() => setCopied(false), 2000);
          });
        }}
        className="inline-flex h-8 shrink-0 items-center gap-1.5 rounded-sm border border-input px-3 text-[13px] font-medium text-foreground transition-colors duration-[120ms] hover:bg-secondary"
      >
        {copied ? (
          <Check className="h-3.5 w-3.5 text-ok" aria-hidden="true" />
        ) : (
          <Copy className="h-3.5 w-3.5" aria-hidden="true" />
        )}
        {copied ? "Copied" : "Copy"}
      </button>
    </div>
  );
}
