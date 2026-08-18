"use client";

import { useEffect, useRef } from "react";
import type { ManagedWindow } from "@/domain/windows";
import { useWindowStore } from "@/stores/window-store";
import { getApp } from "@/lib/apps";
import { AppIcon } from "@/components/icons";
import { useLocale, useT } from "@/lib/locale/provider";
import { windowStateLabel } from "@/lib/locale/domain-labels";
import {
  focusWindowRegion,
  registerTaskbarItem,
  unregisterTaskbarItem,
} from "@/lib/focus-registry";

export function TaskbarAppItem({ window }: { window: ManagedWindow }) {
  const t = useT();
  const locale = useLocale();
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

  const app = getApp(window.appId);
  const title = app?.titleKey !== undefined ? t(app.titleKey) : (app?.title ?? window.appId);
  const icon = app?.icon;
  const isMinimized = window.display === "minimized";
  const stateLabel = windowStateLabel(locale, isMinimized ? "minimized" : focused ? "focused" : "open");

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
      aria-label={t("ui.taskbar.windowState", { title, state: stateLabel })}
      className={`bbx-taskbar-item${focused ? " bbx-taskbar-item-focused" : ""}${
        isMinimized ? " bbx-taskbar-item-minimized" : ""
      }`}
      onClick={handleClick}
    >
      {icon !== undefined ? <AppIcon id={icon} size={16} className="shrink-0" /> : null}
      <span className="min-w-0 truncate">{title}</span>
    </button>
  );
}