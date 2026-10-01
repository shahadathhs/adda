import * as CM from "@radix-ui/react-context-menu";
import type { ReactNode } from "react";
import { cn } from "./cn";

export const ContextMenu = CM.Root;
export const ContextMenuTrigger = CM.Trigger;

export function ContextMenuContent({ children }: { children: ReactNode }) {
  return (
    <CM.Portal>
      <CM.Content
        className={cn(
          "z-50 min-w-40 rounded-sm border border-line bg-panel py-1 shadow-xl",
          "text-xs text-fg",
        )}
      >
        {children}
      </CM.Content>
    </CM.Portal>
  );
}

export function ContextMenuItem({
  danger,
  className,
  ...props
}: CM.ContextMenuItemProps & { danger?: boolean }) {
  return (
    <CM.Item
      className={cn(
        "flex cursor-default select-none items-center gap-2 px-2.5 py-1 outline-none",
        "data-[highlighted]:bg-accent/25",
        danger && "text-danger data-[highlighted]:bg-danger/20",
        className,
      )}
      {...props}
    />
  );
}

export function ContextMenuSeparator() {
  return <CM.Separator className="my-1 h-px bg-line" />;
}
