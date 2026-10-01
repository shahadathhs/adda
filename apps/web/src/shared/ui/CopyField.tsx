import { useState } from "react";
import { FiCheck, FiCopy } from "react-icons/fi";

export default function CopyField({ label, value }: { label: string; value: string }) {
  const [copied, setCopied] = useState(false);

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(value);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch {
      /* clipboard unavailable */
    }
  };

  return (
    <div className="flex items-center gap-2">
      <div className="min-w-0 flex-1">
        <div className="mb-1 text-xs text-muted-foreground">{label}</div>
        <div className="truncate rounded bg-muted/50 px-2 py-1.5 font-mono text-xs">{value}</div>
      </div>
      <button
        type="button"
        onClick={copy}
        title="Copy"
        className="mt-4 shrink-0 rounded-md border border-border p-2 text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
      >
        {copied ? <FiCheck className="text-green-500" /> : <FiCopy />}
      </button>
    </div>
  );
}
