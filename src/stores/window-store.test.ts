import { beforeEach, describe, expect, it } from "vitest";
import { resetWindowStoreForTests, useWindowStore } from "./window-store";

beforeEach(() => {
  resetWindowStoreForTests();
});

describe("window store", () => {
  it("opens an app and focuses the new window", () => {
    useWindowStore.getState().open("app_mail");
    const state = useWindowStore.getState();
    expect(state.manager.openWindows).toHaveLength(1);
    expect(state.manager.openWindows[0]).toMatchObject({ id: "win_0", appId: "app_mail" });
    expect(state.manager.focusedWindowId).toBe("win_0");
    expect(state.manager.nextSequence).toBe(1);
  });

  it("is a no-op for an unregistered app", () => {
    const before = useWindowStore.getState().manager;
    useWindowStore.getState().open("app_unknown");
    expect(useWindowStore.getState().manager).toBe(before);
  });

  it("assigns sequential ids across windows", () => {
    const store = useWindowStore.getState();
    store.open("app_mail");
    store.open("app_records");
    expect(useWindowStore.getState().manager.openWindows.map((w) => w.id)).toEqual([
      "win_0",
      "win_1",
    ]);
  });

  it("preserves the id sequence after closing every window", () => {
    const store = useWindowStore.getState();
    store.open("app_mail");
    store.open("app_records");
    store.close("win_0");
    store.close("win_1");
    store.open("app_mail");
    expect(useWindowStore.getState().manager.openWindows[0]?.id).toBe("win_2");
  });

  it("minimizes and restores a window", () => {
    const store = useWindowStore.getState();
    store.open("app_mail");
    store.minimize("win_0");
    let state = useWindowStore.getState();
    expect(state.manager.openWindows[0]?.display).toBe("minimized");
    expect(state.manager.focusedWindowId).toBeNull();
    store.restore("win_0");
    state = useWindowStore.getState();
    expect(state.manager.openWindows[0]?.display).toBe("normal");
    expect(state.manager.focusedWindowId).toBe("win_0");
  });

  it("toggles maximize against the current workspace", () => {
    const store = useWindowStore.getState();
    store.open("app_mail");
    store.toggleMaximize("win_0");
    let state = useWindowStore.getState();
    expect(state.manager.openWindows[0]?.display).toBe("maximized");
    expect(state.manager.openWindows[0]?.bounds).toEqual({ x: 0, y: 0, width: 1920, height: 1080 });
    store.toggleMaximize("win_0");
    state = useWindowStore.getState();
    expect(state.manager.openWindows[0]?.display).toBe("normal");
    expect(state.manager.openWindows[0]?.bounds).toEqual({ x: 0, y: 0, width: 800, height: 600 });
  });

  it("clamps movement into the workspace", () => {
    const store = useWindowStore.getState();
    store.open("app_mail");
    store.move("win_0", 5000, 5000);
    const window = useWindowStore.getState().manager.openWindows[0];
    expect(window?.bounds).toEqual({ x: 1120, y: 480, width: 800, height: 600 });
  });

  it("clamps resizing between the minimum and the workspace", () => {
    const store = useWindowStore.getState();
    store.open("app_mail");
    store.resize("win_0", 10, 10);
    let window = useWindowStore.getState().manager.openWindows[0];
    expect(window?.bounds).toEqual({ x: 0, y: 0, width: 480, height: 360 });
    store.resize("win_0", 5000, 5000);
    window = useWindowStore.getState().manager.openWindows[0];
    expect(window?.bounds).toEqual({ x: 0, y: 0, width: 1920, height: 1080 });
  });

  it("raises a moved window to the top and focuses it", () => {
    const store = useWindowStore.getState();
    store.open("app_mail");
    store.open("app_records");
    store.move("win_0", 100, 100);
    const state = useWindowStore.getState();
    expect(state.manager.openWindows.map((w) => w.id)).toEqual(["win_1", "win_0"]);
    expect(state.manager.focusedWindowId).toBe("win_0");
  });

  it("resets the workspace to a safe layout", () => {
    const store = useWindowStore.getState();
    store.open("app_mail");
    store.open("app_records");
    store.toggleMaximize("win_1");
    store.minimize("win_0");
    const { manager } = useWindowStore.getState();
    expect(manager.openWindows[0]?.display).toBe("minimized");
    store.resetWorkspace();
    const state = useWindowStore.getState();
    expect(state.manager.openWindows.map((w) => w.display)).toEqual(["normal", "normal"]);
    expect(state.manager.openWindows.map((w) => w.restoreBounds)).toEqual([null, null]);
    expect(state.manager.focusedWindowId).toBe("win_1");
  });

  it("records the measured workspace", () => {
    useWindowStore.getState().setWorkspace({ width: 800, height: 600 });
    expect(useWindowStore.getState().workspace).toEqual({ width: 800, height: 600 });
  });

  it("hydrates a persisted layout into the current workspace", () => {
    const store = useWindowStore.getState();
    store.open("app_mail");
    store.move("win_0", 120, 90);
    const manager = useWindowStore.getState().manager;
    const snapshot = {
      openWindows: manager.openWindows,
      focusedWindowId: manager.focusedWindowId,
      nextSequence: manager.nextSequence,
    };

    resetWindowStoreForTests();
    useWindowStore.getState().hydrateLayout(snapshot);
    const state = useWindowStore.getState();
    expect(state.manager.openWindows).toHaveLength(1);
    expect(state.manager.openWindows[0]?.bounds).toEqual({ x: 120, y: 90, width: 800, height: 600 });
    expect(state.manager.focusedWindowId).toBe("win_0");
  });

  it("is a no-op when hydrating into a non-empty desktop", () => {
    const store = useWindowStore.getState();
    store.open("app_mail");
    const before = useWindowStore.getState().manager;
    useWindowStore
      .getState()
      .hydrateLayout({ openWindows: [], focusedWindowId: null, nextSequence: 0 });
    expect(useWindowStore.getState().manager).toBe(before);
  });
});