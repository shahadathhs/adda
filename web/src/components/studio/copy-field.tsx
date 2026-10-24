"use client";

import { useState } from "react";
import { Copy, Eye, EyeOff } from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/cn";

/** A read-only mono value with a copy button; `secret` hides it behind a reveal toggle. */
export function CopyField({
  label,
  id,
  value,
  secret = false,
}: {
  label: string;
  id: string;
  value: string;
  secret?: boolean;
}) {
  const [shown, setShown] = useState(!secret);
  const btn =
    "grid h-7 w-7 place-items-center rounded-sm text-muted-foreground transition-colors duration-120 hover:bg-secondary hover:text-foreground focus-visible:outline-2 focus-visible:outline-ring";
  return (
    <div>
      <label htmlFor={id} className="mb-1.5 block text-sm text-muted-foreground">
        {label}
      </label>
      <div className="flex items-center gap-1 rounded-sm border border-input bg-input/50 pl-3 pr-1">
        <input
          id={id}
          readOnly
          type={shown ? "text" : "password"}
          value={value}
          onFocus={(e) => e.currentTarget.select()}
          className={cn(
            "h-9 min-w-0 flex-1 bg-transparent font-num text-[13px] text-foreground outline-none",
          )}
        />
        {secret && (
          <button
            type="button"
            className={btn}
            aria-label={shown ? `Hide ${label}` : `Show ${label}`}
            onClick={() => setShown((v) => !v)}
          >
            {shown ? (
              <EyeOff className="h-4 w-4" aria-hidden="true" />
            ) : (
              <Eye className="h-4 w-4" aria-hidden="true" />
            )}
          </button>
        )}
        <button
          type="button"
          className={btn}
          aria-label={`Copy ${label}`}
          onClick={() => {
            void navigator.clipboard.writeText(value);
            toast.success(`${label} copied`);
          }}
        >
          <Copy className="h-4 w-4" aria-hidden="true" />
        </button>
      </div>
    </div>
  );
}
