import { describe, expect, it } from "vitest";
import type { WindowManagerState } from "./types";
import {
  closeWindow,
  createDesktop,
  focusWindow,
  getFocusedWindow,
  maximizeWindow,
  minimizeWindow,
  moveWindow,
  openWindow,
  registerApp,
  resetLayout,
  resizeWindow,
  restoreWindow,
  toggleMaximize,
  unmaximizeWindow,
} from "./transitions";
import {
  MAIL_APP,
  MIN_SIZE_APP,
  RECORDS_APP,
  TEST_APPS,
  TINY_WORKSPACE,
  WORKSPACE,
  ZERO_WORKSPACE,
  deepFreeze,
} from "@/test/fixtures/windows";

function freshDesktop(): WindowManagerState {
  return deepFreeze(createDesktop(TEST_APPS));
}

function openMail(state: WindowManagerState): WindowManagerState {
  return openWindow(state, MAIL_APP.appId, WORKSPACE);
}

function openRecords(state: WindowManagerState): WindowManagerState {
  return openWindow(state, RECORDS_APP.appId, WORKSPACE);
}

describe("createDesktop", () => {
  it("creates an empty desktop with a sequencer ready to start at win_0", () => {
    const state = createDesktop();
    expect(state.registeredApps).toEqual([]);
    expect(state.openWindows).toEqual([]);
    expect(state.focusedWindowId).toBeNull();
    expect(state.nextSequence).toBe(0);
  });

  it("registers the provided applications", () => {
    const state = createDesktop(TEST_APPS);
    expect(state.registeredApps).toEqual(TEST_APPS);
  });
});

describe("registerApp", () => {
  it("appends a new application", () => {
    const state = registerApp(freshDesktop(), { appId: "app_notes", title: "Notes" });
    expect(state.registeredApps.map((app) => app.appId)).toEqual([
      ...TEST_APPS.map((app) => app.appId),
      "app_notes",
    ]);
  });

  it("returns the same reference when the application id already exists", () => {
    const desktop = freshDesktop();
    const state = registerApp(desktop, MAIL_APP);
    expect(state).toBe(desktop);
  });

  it("lets a freshly registered application be opened", () => {
    const state = openWindow(registerApp(freshDesktop(), { appId: "app_notes", title: "Notes" }), "app_notes", WORKSPACE);
    expect(state.openWindows).toHaveLength(1);
    expect(state.openWindows[0]?.appId).toBe("app_notes");
  });
});

describe("openWindow", () => {
  it("is a no-op that returns the same reference for an unregistered app", () => {
    const desktop = freshDesktop();
    const state = openWindow(desktop, "app_unknown", WORKSPACE);
    expect(state).toBe(desktop);
    expect(state.openWindows).toEqual([]);
  });

  it("opens a normal window with the default geometry and deterministic id", () => {
    const state = openMail(freshDesktop());
    expect(state.openWindows).toHaveLength(1);
    expect(state.openWindows[0]).toMatchObject({
      id: "win_0",
      appId: MAIL_APP.appId,
      display: "normal",
      restoreBounds: null,
      displayBeforeMinimize: null,
      bounds: { x: 0, y: 0, width: 800, height: 600 },
    });
    expect(state.focusedWindowId).toBe("win_0");
    expect(state.nextSequence).toBe(1);
  });

  it("applies the application minimum size to fresh windows", () => {
    const state = openWindow(freshDesktop(), MIN_SIZE_APP.appId, WORKSPACE);
    expect(state.openWindows[0]?.bounds).toEqual({ x: 0, y: 0, width: 1000, height: 700 });
  });

  it("assigns sequential ids and keeps stacking order on consecutive opens", () => {
    const state = openRecords(openMail(freshDesktop()));
    expect(state.openWindows.map((entry) => entry.id)).toEqual(["win_0", "win_1"]);
    expect(state.focusedWindowId).toBe("win_1");
  });

  it("supports multiple windows of the same app", () => {
    const state = openMail(openMail(freshDesktop()));
    expect(state.openWindows).toHaveLength(2);
    expect(state.openWindows.map((entry) => entry.id)).toEqual(["win_0", "win_1"]);
  });

  it("continues the id sequence after every window closes", () => {
    const closed = closeWindow(closeWindow(openRecords(openMail(freshDesktop())), "win_1"), "win_0");
    expect(closed.nextSequence).toBe(2);
    const reopened = openMail(closed);
    expect(reopened.openWindows[0]?.id).toBe("win_2");
  });
});

describe("closeWindow", () => {
  it("is a no-op returning the same reference for an unknown id", () => {
    const state = openMail(freshDesktop());
    expect(closeWindow(state, "win_41")).toBe(state);
  });

  it("returns to a previous window when the focused window closes", () => {
    const state = closeWindow(openRecords(openMail(freshDesktop())), "win_1");
    expect(state.openWindows.map((entry) => entry.id)).toEqual(["win_0"]);
    expect(state.focusedWindowId).toBe("win_0");
  });

  it("keeps the current focus when a non-focused window closes", () => {
    const state = closeWindow(openRecords(openMail(freshDesktop())), "win_0");
    expect(state.focusedWindowId).toBe("win_1");
  });

  it("clears focus when the final window closes", () => {
    const state = closeWindow(openMail(freshDesktop()), "win_0");
    expect(state.openWindows).toEqual([]);
    expect(state.focusedWindowId).toBeNull();
  });
});

describe("focusWindow", () => {
  it("raises the window and focuses it", () => {
    const state = focusWindow(openRecords(openMail(freshDesktop())), "win_0");
    expect(state.focusedWindowId).toBe("win_0");
    expect(state.openWindows.map((entry) => entry.id)).toEqual(["win_1", "win_0"]);
  });

  it("returns the same reference when the window is already focused", () => {
    const state = openMail(freshDesktop());
    expect(focusWindow(state, "win_0")).toBe(state);
  });

  it("returns the same reference for an unknown id", () => {
    const state = openMail(freshDesktop());
    expect(focusWindow(state, "win_41")).toBe(state);
  });

  it("returns the same reference for a minimized window", () => {
    const state = minimizeWindow(openRecords(openMail(freshDesktop())), "win_0");
    expect(focusWindow(state, "win_0")).toBe(state);
    expect(state.focusedWindowId).toBe("win_1");
  });
});

describe("minimizeWindow", () => {
  it("marks the window minimized, remembers the previous display, and keeps geometry", () => {
    const state = minimizeWindow(openMail(freshDesktop()), "win_0");
    expect(state.openWindows[0]).toMatchObject({
      display: "minimized",
      displayBeforeMinimize: "normal",
      restoreBounds: null,
      bounds: { x: 0, y: 0, width: 800, height: 600 },
    });
    expect(state.focusedWindowId).toBeNull();
  });

  it("shifts focus to the remaining top window when the focused window is minimized", () => {
    const state = minimizeWindow(openRecords(openMail(freshDesktop())), "win_1");
    expect(state.focusedWindowId).toBe("win_0");
  });

  it("keeps focus when a non-focused window is minimized", () => {
    const state = minimizeWindow(openRecords(openMail(freshDesktop())), "win_0");
    expect(state.focusedWindowId).toBe("win_1");
  });

  it("returns the same reference for an already minimized window", () => {
    const state = minimizeWindow(openMail(freshDesktop()), "win_0");
    expect(minimizeWindow(state, "win_0")).toBe(state);
  });

  it("returns the same reference for an unknown id", () => {
    const state = openMail(freshDesktop());
    expect(minimizeWindow(state, "win_41")).toBe(state);
  });
});

describe("restoreWindow", () => {
  it("restores a minimized window to normal, raises it, and focuses it", () => {
    const state = restoreWindow(minimizeWindow(openMail(freshDesktop()), "win_0"), "win_0", WORKSPACE);
    expect(state.openWindows[0]).toMatchObject({
      id: "win_0",
      display: "normal",
      restoreBounds: null,
      displayBeforeMinimize: null,
    });
    expect(state.focusedWindowId).toBe("win_0");
  });

  it("keeps the geometry the window had before minimizing", () => {
    const moved = moveWindow(openMail(freshDesktop()), "win_0", 120, 90, WORKSPACE);
    const minimized = minimizeWindow(moved, "win_0");
    const restored = restoreWindow(minimized, "win_0", WORKSPACE);
    expect(restored.openWindows[0]?.bounds).toEqual({ x: 120, y: 90, width: 800, height: 600 });
  });

  it("restores a maximized-before-minimize window back to maximized preserving restoreBounds", () => {
    const maximized = maximizeWindow(openMail(freshDesktop()), "win_0", WORKSPACE);
    const minimized = minimizeWindow(maximized, "win_0");
    expect(minimized.openWindows[0]?.displayBeforeMinimize).toBe("maximized");
    const restored = restoreWindow(minimized, "win_0", WORKSPACE);
    expect(restored.openWindows[0]).toMatchObject({
      display: "maximized",
      displayBeforeMinimize: null,
      bounds: { x: 0, y: 0, width: WORKSPACE.width, height: WORKSPACE.height },
      restoreBounds: { x: 0, y: 0, width: 800, height: 600 },
    });
    const unmaximized = unmaximizeWindow(restored, "win_0", WORKSPACE);
    expect(unmaximized.openWindows[0]?.bounds).toEqual({ x: 0, y: 0, width: 800, height: 600 });
    expect(unmaximized.openWindows[0]?.restoreBounds).toBeNull();
  });

  it("returns the same reference for a non-minimized window", () => {
    const state = openMail(freshDesktop());
    expect(restoreWindow(state, "win_0", WORKSPACE)).toBe(state);
  });

  it("returns the same reference for an unknown id", () => {
    const state = openMail(freshDesktop());
    expect(restoreWindow(state, "win_41", WORKSPACE)).toBe(state);
  });
});

describe("maximizeWindow", () => {
  it("maximizes a normal window and remembers its previous bounds", () => {
    const state = maximizeWindow(openMail(freshDesktop()), "win_0", WORKSPACE);
    expect(state.openWindows[0]).toMatchObject({
      display: "maximized",
      restoreBounds: { x: 0, y: 0, width: 800, height: 600 },
      bounds: { x: 0, y: 0, width: WORKSPACE.width, height: WORKSPACE.height },
    });
    expect(state.focusedWindowId).toBe("win_0");
  });

  it("returns the same reference for an already maximized window", () => {
    const state = maximizeWindow(openMail(freshDesktop()), "win_0", WORKSPACE);
    expect(maximizeWindow(state, "win_0", WORKSPACE)).toBe(state);
  });

  it("returns the same reference for a minimized window", () => {
    const state = minimizeWindow(openMail(freshDesktop()), "win_0");
    expect(maximizeWindow(state, "win_0", WORKSPACE)).toBe(state);
  });
});

describe("unmaximizeWindow", () => {
  it("restores the exact previous bounds and clears restoreBounds", () => {
    const moved = moveWindow(openMail(freshDesktop()), "win_0", 200, 160, WORKSPACE);
    const state = unmaximizeWindow(maximizeWindow(moved, "win_0", WORKSPACE), "win_0", WORKSPACE);
    expect(state.openWindows[0]).toMatchObject({
      display: "normal",
      bounds: { x: 200, y: 160, width: 800, height: 600 },
      restoreBounds: null,
    });
    expect(state.focusedWindowId).toBe("win_0");
  });

  it("returns the same reference for a normal window", () => {
    const state = openMail(freshDesktop());
    expect(unmaximizeWindow(state, "win_0", WORKSPACE)).toBe(state);
  });
});

describe("toggleMaximize", () => {
  it("maximizes a normal window", () => {
    const state = toggleMaximize(openMail(freshDesktop()), "win_0", WORKSPACE);
    expect(state.openWindows[0]?.display).toBe("maximized");
  });

  it("unmaximizes a maximized window", () => {
    const state = toggleMaximize(toggleMaximize(openMail(freshDesktop()), "win_0", WORKSPACE), "win_0", WORKSPACE);
    expect(state.openWindows[0]).toMatchObject({
      display: "normal",
      bounds: { x: 0, y: 0, width: 800, height: 600 },
      restoreBounds: null,
    });
  });

  it("returns the same reference for a minimized window", () => {
    const state = minimizeWindow(openMail(freshDesktop()), "win_0");
    expect(toggleMaximize(state, "win_0", WORKSPACE)).toBe(state);
  });
});

describe("moveWindow", () => {
  it("moves a normal window and raises it to the top", () => {
    const state = moveWindow(openRecords(openMail(freshDesktop())), "win_0", 400, 300, WORKSPACE);
    const moved = state.openWindows.find((entry) => entry.id === "win_0");
    expect(moved?.bounds).toEqual({ x: 400, y: 300, width: 800, height: 600 });
    expect(state.focusedWindowId).toBe("win_0");
  });

  it("clamps movement into the workspace", () => {
    const state = moveWindow(openMail(freshDesktop()), "win_0", -400, 5000, WORKSPACE);
    expect(state.openWindows[0]?.bounds.x).toBe(0);
    expect(state.openWindows[0]?.bounds.y).toBe(WORKSPACE.height - 600);
  });

  it("returns the same reference for an unknown id", () => {
    const state = openMail(freshDesktop());
    expect(moveWindow(state, "win_41", 10, 10, WORKSPACE)).toBe(state);
  });

  it("returns the same reference for a maximized window", () => {
    const state = maximizeWindow(openMail(freshDesktop()), "win_0", WORKSPACE);
    expect(moveWindow(state, "win_0", 10, 10, WORKSPACE)).toBe(state);
  });

  it("returns the same reference for a minimized window", () => {
    const state = minimizeWindow(openMail(freshDesktop()), "win_0");
    expect(moveWindow(state, "win_0", 10, 10, WORKSPACE)).toBe(state);
  });
});

describe("resizeWindow", () => {
  it("resizes a normal window within the minimum and workspace bounds", () => {
    const state = resizeWindow(openMail(freshDesktop()), "win_0", 1000, 700, WORKSPACE);
    expect(state.openWindows[0]?.bounds).toEqual({ x: 0, y: 0, width: 1000, height: 700 });
    expect(state.focusedWindowId).toBe("win_0");
  });

  it("clamps the size to the minimum and the workspace", () => {
    const small = resizeWindow(openMail(freshDesktop()), "win_0", 100, 100, WORKSPACE);
    expect(small.openWindows[0]?.bounds).toEqual({ x: 0, y: 0, width: 320, height: 240 });
    const huge = resizeWindow(openMail(freshDesktop()), "win_0", 5000, 5000, WORKSPACE);
    expect(huge.openWindows[0]?.bounds).toEqual({ x: 0, y: 0, width: 1920, height: 1080 });
  });

  it("respects the application minimum size", () => {
    const state = openWindow(freshDesktop(), MIN_SIZE_APP.appId, WORKSPACE);
    const resized = resizeWindow(state, "win_0", 300, 200, WORKSPACE);
    expect(resized.openWindows[0]?.bounds).toEqual({ x: 0, y: 0, width: 1000, height: 700 });
  });

  it("returns the same reference for a maximized window", () => {
    const state = maximizeWindow(openMail(freshDesktop()), "win_0", WORKSPACE);
    expect(resizeWindow(state, "win_0", 900, 900, WORKSPACE)).toBe(state);
  });
});

describe("resetLayout", () => {
  it("normalizes every window, keeps order, and focuses the last window", () => {
    let state = openRecords(openMail(freshDesktop()));
    state = minimizeWindow(state, "win_0");
    state = maximizeWindow(state, "win_1", WORKSPACE);
    const result = resetLayout(state, WORKSPACE);
    expect(result.openWindows.map((entry) => entry.id)).toEqual(["win_0", "win_1"]);
    expect(result.openWindows.every((entry) => entry.display === "normal")).toBe(true);
    expect(result.openWindows.every((entry) => entry.restoreBounds === null)).toBe(true);
    expect(result.openWindows.every((entry) => entry.displayBeforeMinimize === null)).toBe(true);
    expect(result.openWindows[0]?.bounds).toEqual({ x: 0, y: 0, width: 800, height: 600 });
    expect(result.focusedWindowId).toBe("win_1");
  });

  it("clamps windows into a smaller workspace", () => {
    const result = resetLayout(openMail(freshDesktop()), TINY_WORKSPACE);
    expect(result.openWindows[0]?.bounds).toEqual({
      x: 0,
      y: 0,
      width: TINY_WORKSPACE.width,
      height: TINY_WORKSPACE.height,
    });
  });

  it("preserves the id sequence", () => {
    const state = openMail(freshDesktop());
    const result = resetLayout(state, WORKSPACE);
    expect(result.nextSequence).toBe(state.nextSequence);
  });

  it("returns the same reference when there are no open windows", () => {
    const desktop = freshDesktop();
    expect(resetLayout(desktop, WORKSPACE)).toBe(desktop);
  });
});

describe("window geometry in edge workspaces", () => {
  it("fits a fresh window into a tiny workspace", () => {
    const state = openWindow(freshDesktop(), MAIL_APP.appId, TINY_WORKSPACE);
    expect(state.openWindows[0]?.bounds).toEqual({
      x: 0,
      y: 0,
      width: TINY_WORKSPACE.width,
      height: TINY_WORKSPACE.height,
    });
  });

  it("keeps valid zero geometry and focus in an empty workspace", () => {
    const state = openWindow(freshDesktop(), MAIL_APP.appId, ZERO_WORKSPACE);
    expect(state.openWindows[0]?.bounds).toEqual({ x: 0, y: 0, width: 0, height: 0 });
    expect(state.focusedWindowId).toBe("win_0");
    const maximized = maximizeWindow(state, "win_0", ZERO_WORKSPACE);
    expect(maximized.openWindows[0]?.bounds).toEqual({ x: 0, y: 0, width: 0, height: 0 });
  });
});

describe("immutability", () => {
  it("never mutates the frozen input state", () => {
    const base = freshDesktop();
    const snapshot = JSON.stringify(base);
    expect(() => {
      let s = base;
      s = openWindow(s, MAIL_APP.appId, WORKSPACE);
      s = openWindow(s, RECORDS_APP.appId, WORKSPACE);
      s = moveWindow(s, "win_1", 100, 100, WORKSPACE);
      s = resizeWindow(s, "win_1", 640, 480, WORKSPACE);
      s = focusWindow(s, "win_0");
      s = maximizeWindow(s, "win_0", WORKSPACE);
      s = minimizeWindow(s, "win_1");
      s = restoreWindow(s, "win_1", WORKSPACE);
      s = toggleMaximize(s, "win_0", WORKSPACE);
      s = resetLayout(s, WORKSPACE);
      s = registerApp(s, { appId: "app_extra", title: "Extra" });
      s = closeWindow(s, "win_0");
    }).not.toThrow();
    expect(JSON.stringify(base)).toBe(snapshot);
  });

  it("creates new state references for state-changing operations", () => {
    const desktop = freshDesktop();
    const opened = openMail(desktop);
    expect(opened).not.toBe(desktop);
    expect(opened.openWindows).not.toBe(desktop.openWindows);
  });
});

describe("getFocusedWindow", () => {
  it("returns the focused window", () => {
    const state = openRecords(openMail(freshDesktop()));
    expect(getFocusedWindow(state)?.appId).toBe(RECORDS_APP.appId);
  });

  it("returns null when no window is focused", () => {
    expect(getFocusedWindow(freshDesktop())).toBeNull();
  });
});