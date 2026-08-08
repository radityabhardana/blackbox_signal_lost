import { act, render } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { createDesktop, openWindow } from "@/domain/windows";
import type { PersistedWindowLayout } from "@/domain/windows";
import { MAIL_APP, TEST_APPS, WORKSPACE } from "@/test/fixtures/windows";
import { resetWindowStoreForTests, useWindowStore } from "@/stores/window-store";
import { LAYOUT_STORAGE_KEY, serializeLayout } from "@/infrastructure/persistence/layout-schema";
import { useLayoutPersistence } from "./use-layout-persistence";

function validSnapshot(): PersistedWindowLayout {
  const manager = openWindow(createDesktop(TEST_APPS), MAIL_APP.appId, WORKSPACE);
  return {
    openWindows: manager.openWindows,
    focusedWindowId: manager.focusedWindowId,
    nextSequence: manager.nextSequence,
  };
}

function Harness() {
  useLayoutPersistence();
  return null;
}

beforeEach(() => {
  window.localStorage.clear();
  vi.useFakeTimers();
});

afterEach(() => {
  act(() => {
    resetWindowStoreForTests();
  });
  window.localStorage.clear();
  vi.useRealTimers();
});

describe("useLayoutPersistence", () => {
  it("waits for a non-zero workspace before hydrating and never clobbers the stored snapshot first", () => {
    resetWindowStoreForTests({ width: 0, height: 0 });
    const stored = validSnapshot();
    window.localStorage.setItem(LAYOUT_STORAGE_KEY, serializeLayout(stored));

    render(<Harness />);
    expect(useWindowStore.getState().manager.openWindows).toHaveLength(0);
    expect(window.localStorage.getItem(LAYOUT_STORAGE_KEY)).toBe(serializeLayout(stored));

    act(() => useWindowStore.getState().setWorkspace({ width: 1920, height: 1080 }));
    expect(useWindowStore.getState().manager.openWindows).toHaveLength(1);
    act(() => useWindowStore.getState().setWorkspace({ width: 1600, height: 900 }));
    expect(useWindowStore.getState().manager.openWindows).toHaveLength(1);
  });

  it("hydrates a valid snapshot exactly once", () => {
    resetWindowStoreForTests();
    const stored = validSnapshot();
    window.localStorage.setItem(LAYOUT_STORAGE_KEY, serializeLayout(stored));

    render(<Harness />);
    expect(useWindowStore.getState().manager.openWindows).toHaveLength(1);
    expect(useWindowStore.getState().manager.focusedWindowId).toBe("win_0");
  });

  it("starts clean and enables autosave when no snapshot exists", () => {
    resetWindowStoreForTests();
    render(<Harness />);
    expect(useWindowStore.getState().manager.openWindows).toHaveLength(0);

    act(() => useWindowStore.getState().open(MAIL_APP.appId));
    expect(window.localStorage.getItem(LAYOUT_STORAGE_KEY)).toBeNull();
    act(() => {
      vi.advanceTimersByTime(800);
    });
    expect(window.localStorage.getItem(LAYOUT_STORAGE_KEY)).not.toBeNull();
  });

  it("ignores a malformed stored snapshot and autosaves from a clean desktop", () => {
    resetWindowStoreForTests();
    window.localStorage.setItem(LAYOUT_STORAGE_KEY, "{broken");
    render(<Harness />);
    expect(useWindowStore.getState().manager.openWindows).toHaveLength(0);

    act(() => useWindowStore.getState().open(MAIL_APP.appId));
    act(() => {
      vi.advanceTimersByTime(800);
    });
    expect(window.localStorage.getItem(LAYOUT_STORAGE_KEY)).not.toBeNull();
  });

  it("flushes a pending snapshot on pagehide", () => {
    resetWindowStoreForTests();
    render(<Harness />);
    act(() => useWindowStore.getState().open(MAIL_APP.appId));
    expect(window.localStorage.getItem(LAYOUT_STORAGE_KEY)).toBeNull();

    act(() => {
      window.dispatchEvent(new Event("pagehide"));
    });
    const raw = window.localStorage.getItem(LAYOUT_STORAGE_KEY);
    expect(raw).not.toBeNull();
    expect(JSON.parse(raw as string).openWindows).toHaveLength(1);
  });

  it("does not discard a pending snapshot on cleanup", () => {
    resetWindowStoreForTests();
    const view = render(<Harness />);
    act(() => useWindowStore.getState().open(MAIL_APP.appId));
    expect(window.localStorage.getItem(LAYOUT_STORAGE_KEY)).toBeNull();

    act(() => view.unmount());
    const raw = window.localStorage.getItem(LAYOUT_STORAGE_KEY);
    expect(raw).not.toBeNull();
    expect(JSON.parse(raw as string).openWindows).toHaveLength(1);
  });
});