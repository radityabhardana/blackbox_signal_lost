"use client";

import type { MouseEvent as ReactMouseEvent, PointerEvent as ReactPointerEvent } from "react";
import type { ManagedWindow } from "@/domain/windows";
import { useWindowStore } from "@/stores/window-store";
import { getApp } from "@/lib/apps";
import { SystemGlyph } from "@/components/icons";
import { useT } from "@/lib/locale/provider";
import {
  focusLauncherButton,
  focusTaskbarItem,
  focusWindowRegion,
} from "@/lib/focus-registry";

export function WindowControls({ window }: { window: ManagedWindow }) {
  const t = useT();
  const minimize = useWindowStore((state) => state.minimize);
  const close = useWindowStore((state) => state.close);
  const toggleMaximize = useWindowStore((state) => state.toggleMaximize);

  const app = getApp(window.appId);
  const title = app?.titleKey !== undefined ? t(app.titleKey) : (app?.title ?? window.appId);
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
    <div role="group" aria-label={t("ui.window.controlsGroup", { title })} className="flex items-center gap-1">
      <button
        type="button"
        aria-label={`${t("ui.window.minimize")} ${title}`}
        title={t("ui.window.minimize")}
        className="bbx-window-control"
        onPointerDown={stopPointer}
        onDoubleClick={stopDoubleClick}
        onClick={handleMinimize}
      >
        <SystemGlyph id="minimize" size={16} />
      </button>
      <button
        type="button"
        aria-label={`${isMaximized ? t("ui.window.restore") : t("ui.window.maximize")} ${title}`}
        title={isMaximized ? t("ui.window.restore") : t("ui.window.maximize")}
        className="bbx-window-control"
        onPointerDown={stopPointer}
        onDoubleClick={stopDoubleClick}
        onClick={() => toggleMaximize(window.id)}
      >
        <SystemGlyph id={isMaximized ? "restore" : "maximize"} size={16} />
      </button>
      <button
        type="button"
        aria-label={`${t("ui.window.close")} ${title}`}
        title={t("ui.window.close")}
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