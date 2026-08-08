"use client";

import { useRef } from "react";
import type { KeyboardEvent as ReactKeyboardEvent } from "react";
import type { ManagedWindow } from "@/domain/windows";
import { useWindowStore } from "@/stores/window-store";
import { getApp } from "@/lib/apps";
import { usePointerDrag } from "@/hooks/use-pointer-drag";

const RESIZE_KEYBOARD_STEP = 16;

export function ResizeHandle({ window }: { window: ManagedWindow }) {
  const resize = useWindowStore((state) => state.resize);
  const startSize = useRef<{ width: number; height: number } | null>(null);
  const title = getApp(window.appId)?.title ?? window.appId;

  const drag = usePointerDrag({
    enabled: true,
    onStart: () => {
      startSize.current = { width: window.bounds.width, height: window.bounds.height };
    },
    onMove: (dx, dy) => {
      const start = startSize.current;
      if (!start) {
        return;
      }
      resize(window.id, start.width + dx, start.height + dy);
    },
  });

  const handleKeyDown = (event: ReactKeyboardEvent<HTMLElement>): void => {
    let dx = 0;
    let dy = 0;
    if (event.key === "ArrowRight") dx = RESIZE_KEYBOARD_STEP;
    else if (event.key === "ArrowDown") dy = RESIZE_KEYBOARD_STEP;
    else if (event.key === "ArrowLeft") dx = -RESIZE_KEYBOARD_STEP;
    else if (event.key === "ArrowUp") dy = -RESIZE_KEYBOARD_STEP;
    else return;
    event.preventDefault();
    const current =
      useWindowStore
        .getState()
        .manager.openWindows.find((entry) => entry.id === window.id)?.bounds ?? window.bounds;
    resize(window.id, current.width + dx, current.height + dy);
  };

  return (
    <div
      role="button"
      aria-label={`Resize ${title}`}
      tabIndex={0}
      className="bbx-resize-handle"
      {...drag}
      onKeyDown={handleKeyDown}
    />
  );
}