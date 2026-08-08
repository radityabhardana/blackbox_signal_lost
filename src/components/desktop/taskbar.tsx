"use client";

import { useWindowStore } from "@/stores/window-store";
import { SystemTime } from "@/components/desktop/system-time";
import { Launcher } from "./launcher";
import { WindowSwitcher } from "./window-switcher";
import { TaskbarAppItems } from "./taskbar-app-items";

export function Taskbar() {
  const resetWorkspace = useWindowStore((state) => state.resetWorkspace);

  return (
    <footer
      aria-label="Taskbar"
      className="z-bbx-taskbar flex h-12 shrink-0 items-center gap-3 border-t border-bbx-surface-2 bg-bbx-bg-1 px-3"
    >
      <nav aria-label="Application launcher">
        <Launcher />
      </nav>
      <WindowSwitcher />
      <TaskbarAppItems />
      <span className="font-mono text-xs uppercase tracking-widest text-bbx-text-2">
        Case: none
      </span>
      <span className="ml-auto flex items-center gap-3">
        <button
          type="button"
          title="Reset workspace layout"
          className="bbx-btn px-2 py-1 text-[0.625rem]"
          onClick={resetWorkspace}
        >
          Reset workspace
        </button>
        <span className="font-mono text-xs tabular-nums text-bbx-text-2">
          <SystemTime />
        </span>
      </span>
    </footer>
  );
}