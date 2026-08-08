"use client";

import { useEffect, useRef } from "react";
import type { CSSProperties } from "react";
import type { ManagedWindow } from "@/domain/windows";
import { useWindowStore } from "@/stores/window-store";
import { getApp } from "@/lib/apps";
import { registerWindowRegion, unregisterWindowRegion } from "@/lib/focus-registry";
import { usePointerDrag } from "@/hooks/use-pointer-drag";
import { WindowContent } from "./window-content";
import { WindowControls } from "./window-controls";
import { ResizeHandle } from "./resize-handle";

export function WindowFrame({ window, focused }: { window: ManagedWindow; focused: boolean }) {
  const frameRef = useRef<HTMLElement | null>(null);
  const dragStart = useRef<{ x: number; y: number } | null>(null);
  const focusWindow = useWindowStore((state) => state.focus);
  const moveWindow = useWindowStore((state) => state.move);
  const toggleMaximize = useWindowStore((state) => state.toggleMaximize);

  useEffect(() => {
    const element = frameRef.current;
    if (!element) {
      return;
    }
    registerWindowRegion(window.id, element);
    return () => unregisterWindowRegion(window.id);
  }, [window.id]);

  const drag = usePointerDrag({
    enabled: window.display === "normal",
    onStart: () => {
      dragStart.current = { x: window.bounds.x, y: window.bounds.y };
    },
    onMove: (dx, dy) => {
      const start = dragStart.current;
      if (!start) {
        return;
      }
      moveWindow(window.id, start.x + dx, start.y + dy);
    },
  });

  const app = getApp(window.appId);
  const title = app?.title ?? window.appId;
  const titleId = `win-title-${window.id}`;

  const style: CSSProperties = {
    left: window.bounds.x,
    top: window.bounds.y,
    width: window.bounds.width,
    height: window.bounds.height,
  };

  return (
    <section
      ref={frameRef}
      aria-labelledby={titleId}
      tabIndex={-1}
      data-testid={`window-${window.id}`}
      className={`bbx-window${focused ? " bbx-window-focused" : ""}`}
      style={style}
      onPointerDownCapture={() => focusWindow(window.id)}
    >
      <header
        className="bbx-window-titlebar"
        onDoubleClick={() => toggleMaximize(window.id)}
        {...drag}
      >
        <h2 id={titleId} className="bbx-window-title">
          {title}
        </h2>
        <WindowControls window={window} />
      </header>
      <WindowContent appId={window.appId} />
      {window.display === "normal" ? <ResizeHandle window={window} /> : null}
    </section>
  );
}