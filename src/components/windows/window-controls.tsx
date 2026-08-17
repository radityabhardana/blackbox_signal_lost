"use client";

import type { MouseEvent as ReactMouseEvent, PointerEvent as ReactPointerEvent } from "react";
import type { ManagedWindow } from "@/domain/windows";
import { useWindowStore } from "@/stores/window-store";
import { getApp } from "@/lib/apps";
import { SystemGlyph } from "@/components/icons";
import {
  focusLauncherButton,
  focusTaskbarItem,
  focusWindowRegion,
} from "@/lib/focus-registry";

export function WindowControls({ window }: { window: ManagedWindow }) {
  const minimize = useWindowStore((state) => state.minimize);
  const close = useWindowStore((state) => state.close);
  const toggleMaximize = useWindowStore((state) => state.toggleMaximize);

  const title = getApp(window.appId)?.title ?? window.appId;
  const isMaximized = window.display === "maximized";

  const handleMinimize = (): void => {
    minimize(window.id);
    const focused = useWindowStore.getState().manager.focusedWindowId;
    if (focused) {
      focusWindowRegion(focused);
    } else {
      focusTaskbarItem(window.id);
    }
  };

  const handleClose = (): void => {
    close(window.id);
    const focused = useWindowStore.getState().manager.focusedWindowId;
    if (focused) {
      focusWindowRegion(focused);
    } else {
      focusLauncherButton();
    }
  };

  const stopPointer = (event: ReactPointerEvent<HTMLButtonElement>): void => {
    event.stopPropagation();
  };
  const stopDoubleClick = (event: ReactMouseEvent<HTMLButtonElement>): void => {
    event.stopPropagation();
  };

  return (
    <div role="group" aria-label={`${title} window controls`} className="flex items-center gap-1">
      <button
        type="button"
        aria-label={`Minimize ${title}`}
        title="Minimize"
        className="bbx-window-control"
        onPointerDown={stopPointer}
        onDoubleClick={stopDoubleClick}
        onClick={handleMinimize}
      >
        <SystemGlyph id="minimize" size={16} />
      </button>
      <button
        type="button"
        aria-label={isMaximized ? `Restore ${title}` : `Maximize ${title}`}
        title={isMaximized ? "Restore" : "Maximize"}
        className="bbx-window-control"
        onPointerDown={stopPointer}
        onDoubleClick={stopDoubleClick}
        onClick={() => toggleMaximize(window.id)}
      >
        <SystemGlyph id={isMaximized ? "restore" : "maximize"} size={16} />
      </button>
      <button
        type="button"
        aria-label={`Close ${title}`}
        title="Close"
        className="bbx-window-control bbx-window-control-close"
        onPointerDown={stopPointer}
        onDoubleClick={stopDoubleClick}
        onClick={handleClose}
      >
        <SystemGlyph id="close" size={16} />
      </button>
    </div>
  );
}