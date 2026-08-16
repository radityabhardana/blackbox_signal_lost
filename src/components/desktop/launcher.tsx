"use client";

import { useEffect, useRef, useState } from "react";
import type { KeyboardEvent as ReactKeyboardEvent } from "react";
import { APP_CATALOG } from "@/lib/apps";
import { useWindowStore } from "@/stores/window-store";
import { useOptionalCaseSession } from "@/features/session/case-session";
import { focusWindowRegion, registerLauncherButton, unregisterLauncherButton } from "@/lib/focus-registry";

const MENU_ID = "app-launcher-menu";

export function Launcher() {
  const [open, setOpen] = useState(false);
  const triggerRef = useRef<HTMLButtonElement | null>(null);
  const menuRef = useRef<HTMLDivElement | null>(null);
  const openApp = useWindowStore((state) => state.open);
  const session = useOptionalCaseSession();
  const unlocked = session?.state.unlockedApplications ?? [];

  useEffect(() => {
    if (!open) {
      return;
    }
    menuRef.current?.querySelector<HTMLElement>("[role='menuitem']")?.focus();

    const handleOutsidePointerDown = (event: PointerEvent): void => {
      const target = event.target as Node;
      if (!triggerRef.current?.contains(target) && !menuRef.current?.contains(target)) {
        setOpen(false);
      }
    };
    document.addEventListener("pointerdown", handleOutsidePointerDown);
    return () => document.removeEventListener("pointerdown", handleOutsidePointerDown);
  }, [open]);

  useEffect(() => {
    const trigger = triggerRef.current;
    if (trigger) {
      registerLauncherButton(trigger);
    }
    return unregisterLauncherButton;
  }, []);

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
      menuRef.current?.querySelectorAll<HTMLElement>("[role='menuitem']") ?? [],
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

  const activate = (appId: string): void => {
    openApp(appId);
    setOpen(false);
    const focused = useWindowStore.getState().manager.focusedWindowId;
    if (focused) {
      focusWindowRegion(focused);
    }
  };

  return (
    <div className="relative">
      <button
        ref={triggerRef}
        type="button"
        className="bbx-btn px-2 py-1 text-[0.625rem]"
        aria-haspopup="menu"
        aria-expanded={open}
        aria-controls={MENU_ID}
        onClick={() => setOpen((value) => !value)}
      >
        Launcher
      </button>
      {open ? (
        <div
          id={MENU_ID}
          ref={menuRef}
          role="menu"
          aria-label="Applications"
          className="absolute bottom-12 left-0 z-bbx-modal min-w-48 border border-bbx-surface-2 bg-bbx-surface-2 p-1"
          onKeyDown={handleKeyDown}
        >
          {APP_CATALOG.filter((app) => app.requiresUnlock !== true || unlocked.includes(app.appId)).map((app) => (
            <button
              key={app.appId}
              type="button"
              role="menuitem"
              className="bbx-menu-item"
              onClick={() => activate(app.appId)}
            >
              {app.title}
            </button>
          ))}
        </div>
      ) : null}
    </div>
  );
}