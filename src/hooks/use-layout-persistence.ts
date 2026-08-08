"use client";

import { useEffect } from "react";
import type { PersistedWindowLayout } from "@/domain/windows";
import { useWindowStore } from "@/stores/window-store";
import { createLocalStorageLayoutRepository } from "@/infrastructure/persistence/layout-repository";

const DEBOUNCE_MS = 800;

export function useLayoutPersistence(): void {
  useEffect(() => {
    if (typeof window === "undefined") {
      return;
    }
    const repository = createLocalStorageLayoutRepository(window.localStorage);

    let settled = false;
    let autosaveEnabled = false;
    let pending: PersistedWindowLayout | null = null;
    let timer: number | null = null;
    let unsubscribeAutosave: (() => void) | null = null;

    const currentSnapshot = (): PersistedWindowLayout => {
      const manager = useWindowStore.getState().manager;
      return {
        openWindows: manager.openWindows,
        focusedWindowId: manager.focusedWindowId,
        nextSequence: manager.nextSequence,
      };
    };

    const writePending = (): void => {
      if (pending === null) {
        return;
      }
      repository.save(pending);
      pending = null;
    };

    const scheduleSave = (): void => {
      pending = currentSnapshot();
      if (timer !== null) {
        window.clearTimeout(timer);
      }
      timer = window.setTimeout(() => {
        timer = null;
        writePending();
      }, DEBOUNCE_MS);
    };

    const enableAutosave = (): void => {
      if (autosaveEnabled) {
        return;
      }
      autosaveEnabled = true;
      unsubscribeAutosave = useWindowStore.subscribe((state, previous) => {
        if (state.manager !== previous.manager) {
          scheduleSave();
        }
      });
    };

    const tryHydrate = (): void => {
      if (settled) {
        return;
      }
      const workspace = useWindowStore.getState().workspace;
      if (!(workspace.width > 0 && workspace.height > 0)) {
        return;
      }
      settled = true;
      const stored = repository.load();
      if (stored !== null) {
        useWindowStore.getState().hydrateLayout(stored);
      }
      enableAutosave();
    };

    tryHydrate();

    const unsubscribeWorkspace = useWindowStore.subscribe((state, previous) => {
      if (!settled && state.workspace !== previous.workspace) {
        tryHydrate();
      }
    });

    const flush = (): void => {
      if (timer !== null) {
        window.clearTimeout(timer);
        timer = null;
      }
      writePending();
    };

    const handlePageHide = (): void => flush();
    window.addEventListener("pagehide", handlePageHide);

    return () => {
      window.removeEventListener("pagehide", handlePageHide);
      if (timer !== null) {
        window.clearTimeout(timer);
        timer = null;
      }
      writePending();
      unsubscribeWorkspace();
      unsubscribeAutosave?.();
    };
  }, []);
}