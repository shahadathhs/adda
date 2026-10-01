import { useRef, type MouseEvent, type ReactNode } from "react";
import { getCurrentWindow } from "@tauri-apps/api/window";
import { cn } from "./cn";

const DOUBLE_CLICK_MS = 350;

/**
 * Chrome-style titlebar: bare strip drags the window (native move loop), a
 * quick second press toggles maximize. We implement both manually — Tauri's
 * data-tauri-drag-region starts a drag on every press, which swallows
 * double-clicks, so the attribute is deliberately not used here.
 */
export function TitleBarHeader({
  children,
  className,
}: {
  children: ReactNode;
  className?: string;
}) {
  const lastPress = useRef(0);

  const onMouseDown = (e: MouseEvent<HTMLElement>) => {
    if (e.button !== 0) return;
    // Interactive children (tabs, buttons, selects) behave normally.
    const target = e.target as HTMLElement;
    if (target.closest("button, a, select, input, textarea, [role='button']")) return;

    const now = Date.now();
    if (now - lastPress.current < DOUBLE_CLICK_MS) {
      lastPress.current = 0;
      void getCurrentWindow().toggleMaximize();
      return;
    }
    lastPress.current = now;
    void getCurrentWindow().startDragging();
  };

  return (
    <header
      onMouseDown={onMouseDown}
      className={cn("flex select-none items-center border-b border-line bg-bg", className)}
    >
      {children}
    </header>
  );
}
