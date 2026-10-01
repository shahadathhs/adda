import { Minus, Square, X } from "lucide-react";
import { getCurrentWindow } from "@tauri-apps/api/window";

/**
 * Custom window controls for platforms without native decorations
 * (Windows/Linux). macOS keeps its native traffic lights.
 */
export function WindowControls() {
  const win = getCurrentWindow();
  const btn =
    "flex h-full w-11 items-center justify-center text-muted transition-colors hover:bg-panel2 hover:text-fg";
  return (
    <div className="ml-auto flex h-full shrink-0 items-stretch">
      <button className={btn} title="Minimize" onClick={() => void win.minimize()}>
        <Minus className="h-3.5 w-3.5" />
      </button>
      <button className={btn} title="Maximize" onClick={() => void win.toggleMaximize()}>
        <Square className="h-2.5 w-2.5" />
      </button>
      <button
        className="flex h-full w-11 items-center justify-center text-muted transition-colors hover:bg-danger hover:text-white"
        title="Close"
        onClick={() => void win.close()}
      >
        <X className="h-3.5 w-3.5" />
      </button>
    </div>
  );
}
