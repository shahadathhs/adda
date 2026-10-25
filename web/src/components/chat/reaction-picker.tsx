"use client";

import { useEffect, useRef, useState } from "react";
import { SmilePlus } from "lucide-react";
import { REACTIONS } from "@/lib/reactions";

/** The "add a reaction" button with a small picker of the allowed emoji. */
export function ReactionPicker({ onPick }: { onPick: (emoji: string) => void }) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const close = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    const esc = (e: KeyboardEvent) => e.key === "Escape" && setOpen(false);
    document.addEventListener("mousedown", close);
    document.addEventListener("keydown", esc);
    return () => {
      document.removeEventListener("mousedown", close);
      document.removeEventListener("keydown", esc);
    };
  }, [open]);

  return (
    <div className="relative" ref={ref}>
      <button
        type="button"
        aria-label="Add a reaction"
        aria-haspopup="true"
        aria-expanded={open}
        onClick={() => setOpen((v) => !v)}
        className="grid h-6 w-6 place-items-center rounded-xs text-muted-foreground hover:bg-secondary hover:text-foreground focus-visible:outline-2 focus-visible:outline-ring"
      >
        <SmilePlus className="h-4 w-4" aria-hidden="true" />
      </button>
      {open && (
        <div className="absolute right-0 top-7 z-20 flex gap-0.5 rounded-md border border-border bg-popover p-1 shadow-[0_8px_32px_rgba(0,0,0,0.6)]">
          {REACTIONS.map((emoji) => (
            <button
              key={emoji}
              type="button"
              aria-label={`React with ${emoji}`}
              onClick={() => {
                setOpen(false);
                onPick(emoji);
              }}
              className="grid h-7 w-7 place-items-center rounded-sm text-base hover:bg-secondary focus-visible:outline-2 focus-visible:outline-ring"
            >
              {emoji}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
