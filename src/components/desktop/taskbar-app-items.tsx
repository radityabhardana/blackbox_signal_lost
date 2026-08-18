"use client";

import { useWindowStore } from "@/stores/window-store";
import { useT } from "@/lib/locale/provider";
import { TaskbarAppItem } from "./taskbar-app-item";

export function TaskbarAppItems() {
  const t = useT();
  const windows = useWindowStore((state) => state.manager.openWindows);

  if (windows.length === 0) {
    return null;
  }

  return (
    <div role="toolbar" aria-label={t("ui.taskbar.openWindows")} className="flex items-center gap-1">
      {windows.map((window) => (
        <TaskbarAppItem key={window.id} window={window} />
      ))}
    </div>
  );
}