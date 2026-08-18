"use client";

import { useEffect, useRef, useState } from "react";
import type { KeyboardEvent as ReactKeyboardEvent } from "react";
import { useWindowStore } from "@/stores/window-store";
import { getApp } from "@/lib/apps";
import { AppIcon, SystemGlyph } from "@/components/icons";
import { focusWindowRegion } from "@/lib/focus-registry";
import { useT } from "@/lib/locale/provider";

const PANEL_ID = "window-switcher-panel";

export function WindowSwitcher() {
  const t = useT();
  const [open, setOpen] = useState(false);
  const triggerRef = useRef<HTMLButtonElement | null>(null);
  const panelRef = useRef<HTMLDivElement | null>(null);
  const openWindows = useWindowStore((state) => state.manager.openWindows);
  const windows = openWindows.filter((window) => window.display !== "minimized");
  const focusWindow = useWindowStore((state) => state.focus);
  const hasWindows = windows.length > 0;

  useEffect(() => {
    if (!open) {
      return;
    }
    panelRef.current?.querySelector<HTMLElement>("[role='menuitem']")?.focus();

    const handleOutsidePointerDown = (event: PointerEvent): void => {
      const target = event.target as Node;
      if (!triggerRef.current?.contains(target) && !panelRef.current?.contains(target)) {
        setOpen(false);
      }
    };
    document.addEventListener("pointerdown", handleOutsidePointerDown);
    return () => document.removeEventListener("pointerdown", handleOutsidePointerDown);
  }, [open]);

  const handleKeyDown = (event: ReactKeyboardEvent<HTMLDivElement>): void => {
    if (event.key === "Escape") {
      event.preventDefault();
      setOpen(false);
      triggerRef.current?.focus();
      return;
    }
    if (event.key !== "ArrowDown" && event.key !== "ArrowUp") {
      return;
    }
    event.preventDefault();
    const items = Array.from(
      panelRef.current?.querySelectorAll<HTMLElement>("[role='menuitem']") ?? [],
    );
    if (items.length === 0) {
      return;
    }
    const index = items.indexOf(document.activeElement as HTMLElement);
    const next =
      event.key === "ArrowDown"
        ? (index + 1) % items.length
        : (index - 1 + items.length) % items.length;
    items[next]?.focus();
  };

  const activate = (id: string): void => {
    focusWindow(id);
    setOpen(false);
    focusWindowRegion(id);
  };

  return (
    <div className="relative">
      <button
        ref={triggerRef}
        type="button"
        className="bbx-btn px-2 py-1 text-[0.625rem]"
        aria-haspopup="menu"
        aria-expanded={open}
        aria-controls={PANEL_ID}
        disabled={!hasWindows}
        onClick={() => setOpen((value) => !value)}
      >
        <SystemGlyph id="window_switcher" size={16} className="shrink-0" />
        <span>{t("ui.switcher.button")}</span>
      </button>
      {open ? (
        <div
          id={PANEL_ID}
          ref={panelRef}
          role="menu"
          aria-label={t("ui.switcher.menu")}
          className="absolute bottom-12 left-0 z-bbx-modal min-w-40 border border-bbx-surface-2 bg-bbx-surface-2 p-1"
          onKeyDown={handleKeyDown}
        >
          {windows.map((window) => {
            const app = getApp(window.appId);
            return (
              <button
                key={window.id}
                type="button"
                role="menuitem"
                className="bbx-menu-item"
                onClick={() => activate(window.id)}
              >
                {app?.icon !== undefined ? (
                  <AppIcon id={app.icon} size={16} className="shrink-0" />
                ) : (
                  <SystemGlyph id="discovery" size={16} className="shrink-0" />
                )}
                <span>
                  {app?.titleKey !== undefined ? t(app.titleKey) : (app?.title ?? window.appId)}
                </span>
              </button>
            );
          })}
        </div>
      ) : null}
    </div>
  );
}