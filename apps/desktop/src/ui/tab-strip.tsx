import type { ReactNode } from "react";
import { Plus, X } from "lucide-react";
import { cn } from "./cn";
import {
  ContextMenu,
  ContextMenuContent,
  ContextMenuItem,
  ContextMenuSeparator,
  ContextMenuTrigger,
} from "./context-menu";

export interface TabStripTab {
  id: string;
  icon: ReactNode;
  label: string;
}

/**
 * Chrome/Notion-style dynamic tab strip: click to activate, middle-click or ×
 * to close, right-click for tab actions, + to open a new one.
 */
export function TabStrip({
  tabs,
  activeId,
  onSelect,
  onClose,
  onDuplicate,
  onCloseOthers,
  onNew,
  className,
}: {
  tabs: TabStripTab[];
  activeId: string;
  onSelect: (id: string) => void;
  onClose: (id: string) => void;
  onDuplicate: (id: string) => void;
  onCloseOthers: (id: string) => void;
  onNew: () => void;
  className?: string;
}) {
  return (
    <div className={cn("flex flex-1 items-center gap-1 px-1.5", className)}>
      {tabs.map((t) => {
        const isActive = t.id === activeId;
        return (
          <ContextMenu key={t.id}>
            <ContextMenuTrigger asChild>
              <button
                onClick={() => onSelect(t.id)}
                onMouseDown={(e) => {
                  // Middle-click closes, like every browser.
                  if (e.button === 1) {
                    e.preventDefault();
                    onClose(t.id);
                  }
                }}
                className={cn(
                  "group/tab flex h-7 min-w-28 max-w-44 shrink-0 items-center gap-1.5 rounded-t-sm border-x border-t px-2 text-2xs transition-colors",
                  isActive
                    ? "border-line bg-panel text-fg"
                    : "border-transparent bg-panel2/50 text-muted hover:bg-panel2",
                )}
                title={t.label}
              >
                <span className="shrink-0">{t.icon}</span>
                <span className="min-w-0 flex-1 truncate text-left">{t.label}</span>
                {tabs.length > 1 && (
                  <span
                    role="button"
                    tabIndex={-1}
                    aria-label="Close tab"
                    onClick={(e) => {
                      e.stopPropagation();
                      onClose(t.id);
                    }}
                    className="shrink-0 rounded-xs p-0.5 text-muted opacity-0 transition-opacity hover:bg-line hover:text-fg group-hover/tab:opacity-100"
                  >
                    <X className="h-3 w-3" />
                  </span>
                )}
              </button>
            </ContextMenuTrigger>
            <ContextMenuContent>
              <ContextMenuItem onSelect={() => onDuplicate(t.id)}>Duplicate tab</ContextMenuItem>
              <ContextMenuItem onSelect={() => onNew()}>New tab</ContextMenuItem>
              <ContextMenuSeparator />
              <ContextMenuItem danger disabled={tabs.length === 1} onSelect={() => onClose(t.id)}>
                Close tab
              </ContextMenuItem>
              <ContextMenuItem
                danger
                disabled={tabs.length === 1}
                onSelect={() => onCloseOthers(t.id)}
              >
                Close other tabs
              </ContextMenuItem>
            </ContextMenuContent>
          </ContextMenu>
        );
      })}
      <button
        onClick={onNew}
        title="New tab (⌘T)"
        className="mb-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-sm text-muted transition-colors hover:bg-panel2 hover:text-fg"
      >
        <Plus className="h-3.5 w-3.5" />
      </button>
    </div>
  );
}
