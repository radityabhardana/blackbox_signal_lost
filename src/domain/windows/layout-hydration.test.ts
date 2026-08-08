import { describe, expect, it } from "vitest";
import {
  createDesktop,
  maximizeWindow,
  minimizeWindow,
  moveWindow,
  openWindow,
} from "./transitions";
import {
  hydrateLayout,
  isPersistedLayoutValid,
} from "./layout-hydration";
import type { PersistedWindowLayout } from "./layout-hydration";
import type { WindowManagerState } from "./types";
import {
  MAIL_APP,
  RECORDS_APP,
  TEST_APPS,
  TINY_WORKSPACE,
  WORKSPACE,
  deepFreeze,
} from "@/test/fixtures/windows";

function freshDesktop(): WindowManagerState {
  return createDesktop(TEST_APPS);
}

function snapshotFrom(manager: WindowManagerState): PersistedWindowLayout {
  return {
    openWindows: manager.openWindows,
    focusedWindowId: manager.focusedWindowId,
    nextSequence: manager.nextSequence,
  };
}

function layoutWith(windows: PersistedWindowLayout["openWindows"], overrides: Partial<PersistedWindowLayout> = {}): PersistedWindowLayout {
  return {
    openWindows: windows,
    focusedWindowId: windows.length > 0 ? windows[windows.length - 1]!.id : null,
    nextSequence: windows.length,
    ...overrides,
  };
}

describe("isPersistedLayoutValid", () => {
  it("rejects negative nextSequence", () => {
    const windows = openWindow(freshDesktop(), MAIL_APP.appId, WORKSPACE).openWindows;
    expect(isPersistedLayoutValid(layoutWith(windows, { nextSequence: -1 }))).toBe(false);
  });

  it("rejects duplicate window ids", () => {
    const first = openWindow(freshDesktop(), MAIL_APP.appId, WORKSPACE).openWindows[0]!;
    expect(isPersistedLayoutValid(layoutWith([first, { ...first, id: first.id }]))).toBe(false);
  });

  it("rejects malformed window ids", () => {
    const first = openWindow(freshDesktop(), MAIL_APP.appId, WORKSPACE).openWindows[0]!;
    expect(isPersistedLayoutValid(layoutWith([{ ...first, id: "window_1" }]))).toBe(false);
  });

  it("rejects a maximized window without restoreBounds", () => {
    const first = openWindow(freshDesktop(), MAIL_APP.appId, WORKSPACE).openWindows[0]!;
    expect(
      isPersistedLayoutValid(
        layoutWith([{ ...first, display: "maximized", restoreBounds: null }]),
      ),
    ).toBe(false);
  });

  it("rejects a minimized window without displayBeforeMinimize", () => {
    const first = openWindow(freshDesktop(), MAIL_APP.appId, WORKSPACE).openWindows[0]!;
    expect(
      isPersistedLayoutValid(layoutWith([{ ...first, display: "minimized", displayBeforeMinimize: null }])),
    ).toBe(false);
  });

  it("rejects non-finite geometry", () => {
    const first = openWindow(freshDesktop(), MAIL_APP.appId, WORKSPACE).openWindows[0]!;
    expect(
      isPersistedLayoutValid(
        layoutWith([{ ...first, bounds: { ...first.bounds, width: Number.POSITIVE_INFINITY } }]),
      ),
    ).toBe(false);
  });
});

describe("hydrateLayout", () => {
  it("restores a normal layout with matching geometry", () => {
    let state = freshDesktop();
    state = openWindow(state, MAIL_APP.appId, WORKSPACE);
    state = openWindow(state, RECORDS_APP.appId, WORKSPACE);
    const moved = moveWindow(state, "win_0", 120, 90, WORKSPACE);

    const hydrated = hydrateLayout(freshDesktop(), snapshotFrom(moved), WORKSPACE);
    // moveWindow raises and focuses the moved window, which is reflected in the snapshot.
    expect(hydrated.openWindows.map((window) => window.id)).toEqual(["win_1", "win_0"]);
    expect(hydrated.openWindows.find((window) => window.id === "win_0")?.bounds).toEqual({
      x: 120,
      y: 90,
      width: 800,
      height: 600,
    });
    expect(hydrated.focusedWindowId).toBe("win_0");
  });

  it("clamps restored geometry into a smaller workspace", () => {
    let state = freshDesktop();
    state = openWindow(state, MAIL_APP.appId, WORKSPACE);
    state = moveWindow(state, "win_0", 150, 120, WORKSPACE);

    const hydrated = hydrateLayout(freshDesktop(), snapshotFrom(state), TINY_WORKSPACE);
    const bounds = hydrated.openWindows[0]?.bounds;
    expect(bounds).toBeDefined();
    expect(bounds!.width).toBeLessThanOrEqual(TINY_WORKSPACE.width);
    expect(bounds!.x).toBeGreaterThanOrEqual(0);
  });

  it("restores maximized windows with recomputed bounds and preserved restoreBounds", () => {
    let state = freshDesktop();
    state = openWindow(state, MAIL_APP.appId, WORKSPACE);
    state = moveWindow(state, "win_0", 80, 60, WORKSPACE);
    state = maximizeWindow(state, "win_0", WORKSPACE);

    const hydrated = hydrateLayout(freshDesktop(), snapshotFrom(state), WORKSPACE);
    const window = hydrated.openWindows[0]!;
    expect(window.display).toBe("maximized");
    expect(window.bounds).toEqual({ x: 0, y: 0, width: WORKSPACE.width, height: WORKSPACE.height });
    expect(window.restoreBounds).toEqual({ x: 80, y: 60, width: 800, height: 600 });
    expect(window.displayBeforeMinimize).toBeNull();
  });

  it("restores minimized-from-normal semantics", () => {
    let state = freshDesktop();
    state = openWindow(state, MAIL_APP.appId, WORKSPACE);
    state = moveWindow(state, "win_0", 40, 30, WORKSPACE);
    state = minimizeWindow(state, "win_0");

    const hydrated = hydrateLayout(freshDesktop(), snapshotFrom(state), WORKSPACE);
    const window = hydrated.openWindows[0]!;
    expect(window.display).toBe("minimized");
    expect(window.displayBeforeMinimize).toBe("normal");
    expect(window.restoreBounds).toBeNull();
    expect(window.bounds).toEqual({ x: 40, y: 30, width: 800, height: 600 });
  });

  it("restores minimized-from-maximized semantics", () => {
    let state = freshDesktop();
    state = openWindow(state, MAIL_APP.appId, WORKSPACE);
    state = maximizeWindow(state, "win_0", WORKSPACE);
    state = minimizeWindow(state, "win_0");

    const hydrated = hydrateLayout(freshDesktop(), snapshotFrom(state), WORKSPACE);
    const window = hydrated.openWindows[0]!;
    expect(window.display).toBe("minimized");
    expect(window.displayBeforeMinimize).toBe("maximized");
    expect(window.restoreBounds).toEqual({ x: 0, y: 0, width: 800, height: 600 });
  });

  it("falls back to a derived focus when the persisted focus is invalid", () => {
    let state = freshDesktop();
    state = openWindow(state, MAIL_APP.appId, WORKSPACE);
    state = openWindow(state, RECORDS_APP.appId, WORKSPACE);
    const withFocusOnMinimized = minimizeWindow(state, "win_0");

    const hydrated = hydrateLayout(
      freshDesktop(),
      { ...snapshotFrom(withFocusOnMinimized), focusedWindowId: "win_0" },
      WORKSPACE,
    );
    expect(hydrated.focusedWindowId).toBe("win_1");
  });

  it("drops windows whose app is no longer registered", () => {
    const state = openWindow(freshDesktop(), MAIL_APP.appId, WORKSPACE);
    const layout = snapshotFrom(state);
    const unknown = {
      ...layout,
      openWindows: [
        ...layout.openWindows,
        {
          id: "win_1",
          appId: "app_retired",
          display: "normal" as const,
          bounds: { x: 0, y: 0, width: 800, height: 600 },
          restoreBounds: null,
          displayBeforeMinimize: null,
        },
      ],
      nextSequence: 2,
    };

    const hydrated = hydrateLayout(freshDesktop(), unknown, WORKSPACE);
    expect(hydrated.openWindows.map((window) => window.appId)).toEqual([MAIL_APP.appId]);
  });

  it("rejects duplicate ids safely and keeps the desktop clean", () => {
    const state = openWindow(freshDesktop(), MAIL_APP.appId, WORKSPACE);
    const window = state.openWindows[0]!;
    const layout = layoutWith([window, { ...window }]);

    const target = freshDesktop();
    const hydrated = hydrateLayout(target, layout, WORKSPACE);
    expect(hydrated).toBe(target);
    expect(hydrated.openWindows).toEqual([]);
  });

  it("rejects malformed win_N ids safely", () => {
    const state = openWindow(freshDesktop(), MAIL_APP.appId, WORKSPACE);
    const window = state.openWindows[0]!;
    const layout = layoutWith([{ ...window, id: "win_x" }]);

    const hydrated = hydrateLayout(freshDesktop(), layout, WORKSPACE);
    expect(hydrated.openWindows).toEqual([]);
  });

  it("preserves a higher persisted nextSequence", () => {
    let state = freshDesktop();
    state = openWindow(state, MAIL_APP.appId, WORKSPACE);
    const layout = { ...snapshotFrom(state), nextSequence: 7 };

    const hydrated = hydrateLayout(freshDesktop(), layout, WORKSPACE);
    expect(hydrated.nextSequence).toBe(7);
  });

  it("rejects a nextSequence that is not greater than the retained ids", () => {
    let state = freshDesktop();
    state = openWindow(state, MAIL_APP.appId, WORKSPACE);
    state = openWindow(state, RECORDS_APP.appId, WORKSPACE);
    const layout = { ...snapshotFrom(state), nextSequence: 1 };

    expect(hydrateLayout(freshDesktop(), layout, WORKSPACE).openWindows).toEqual([]);
  });

  it("is a no-op when hydrating into a non-empty desktop", () => {
    const state = openWindow(freshDesktop(), MAIL_APP.appId, WORKSPACE);
    const layout = snapshotFrom(state);
    const target = openWindow(freshDesktop(), RECORDS_APP.appId, WORKSPACE);

    expect(hydrateLayout(target, layout, WORKSPACE)).toBe(target);
  });

  it("never mutates its inputs", () => {
    let state = freshDesktop();
    state = openWindow(state, MAIL_APP.appId, WORKSPACE);
    state = openWindow(state, RECORDS_APP.appId, WORKSPACE);
    const frozen = deepFreeze(freshDesktop());
    const frozenLayout = deepFreeze(snapshotFrom(state));

    let hydrated: WindowManagerState;
    expect(() => {
      hydrated = hydrateLayout(frozen, frozenLayout, WORKSPACE);
    }).not.toThrow();
    expect(hydrated!.openWindows[0]).not.toBe(frozenLayout.openWindows[0]);
    expect(JSON.stringify(frozenLayout)).toBe(JSON.stringify(snapshotFrom(state)));
  });
});