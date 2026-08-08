"use client";

import { useEffect, useRef } from "react";
import type { ManagedWindow } from "@/domain/windows";
import { useWindowStore } from "@/stores/window-store";
import { getApp } from "@/lib/apps";
import {
  focusWindowRegion,
  registerTaskbarItem,
  unregisterTaskbarItem,
} from "@/lib/focus-registry";

export function TaskbarAppItem({ window }: { window: ManagedWindow }) {
  const ref = useRef<HTMLButtonElement | null>(null);
  const focused = useWindowStore((state) => state.manager.focusedWindowId === window.id);
  const restore = useWindowStore((state) => state.restore);
  const focus = useWindowStore((state) => state.focus);

  useEffect(() => {
    const element = ref.current;
    if (!element) {
      return;
    }
    registerTaskbarItem(window.id, element);
    return () => unregisterTaskbarItem(window.id);
  }, [window.id]);

  const title = getApp(window.appId)?.title ?? window.appId;
  const isMinimized = window.display === "minimized";
  const stateLabel = isMinimized ? "minimized" : focused ? "focused" : "open";

  const handleClick = (): void => {
    if (isMinimized) {
      restore(window.id);
      focusWindowRegion(window.id);
    } else {
      focus(window.id);
      focusWindowRegion(window.id);
    }
  };

  return (
    <button
      ref={ref}
      type="button"
      aria-label={`${title} window, ${stateLabel}`}
      className={`bbx-taskbar-item${focused ? " bbx-taskbar-item-focused" : ""}${
        isMinimized ? " bbx-taskbar-item-minimized" : ""
      }`}
      onClick={handleClick}
    >
      {title}
    </button>
  );
}