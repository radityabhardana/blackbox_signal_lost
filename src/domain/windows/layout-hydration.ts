import { clampBounds, maximizeBounds } from "./geometry";
import { DEFAULT_MIN_WINDOW_HEIGHT, DEFAULT_MIN_WINDOW_WIDTH } from "./types";
import type { ManagedWindow, WindowBounds, WindowManagerState, WorkspaceSize } from "./types";

export interface PersistedWindowLayout {
  openWindows: ManagedWindow[];
  focusedWindowId: string | null;
  nextSequence: number;
}

const WINDOW_ID_PATTERN = /^win_([0-9]+)$/;

function windowIndex(id: string): number | null {
  const match = WINDOW_ID_PATTERN.exec(id);
  const token = match?.[1];
  if (token === undefined) {
    return null;
  }
  const index = Number(token);
  return Number.isSafeInteger(index) ? index : null;
}

function isFiniteNumber(value: number): boolean {
  return Number.isFinite(value);
}

function isValidBounds(bounds: WindowBounds): boolean {
  return (
    isFiniteNumber(bounds.x) &&
    isFiniteNumber(bounds.y) &&
    isFiniteNumber(bounds.width) &&
    isFiniteNumber(bounds.height)
  );
}

function isStructurallyValid(window: ManagedWindow): boolean {
  if (!isValidBounds(window.bounds)) {
    return false;
  }
  if (window.restoreBounds !== null && !isValidBounds(window.restoreBounds)) {
    return false;
  }
  if (window.display === "normal") {
    return window.restoreBounds === null && window.displayBeforeMinimize === null;
  }
  if (window.display === "minimized") {
    if (window.displayBeforeMinimize === null) {
      return false;
    }
    return window.displayBeforeMinimize === "maximized"
      ? window.restoreBounds !== null
      : window.restoreBounds === null;
  }
  return window.restoreBounds !== null && window.displayBeforeMinimize === null;
}

export function isPersistedLayoutValid(layout: PersistedWindowLayout): boolean {
  if (!Number.isSafeInteger(layout.nextSequence) || layout.nextSequence < 0) {
    return false;
  }
  const seen = new Set<string>();
  for (const window of layout.openWindows) {
    if (windowIndex(window.id) === null || seen.has(window.id)) {
      return false;
    }
    if (!isStructurallyValid(window)) {
      return false;
    }
    seen.add(window.id);
  }
  return true;
}

interface SizeConstraints {
  minWidth: number;
  minHeight: number;
}

export function hydrateLayout(
  state: WindowManagerState,
  layout: PersistedWindowLayout,
  workspace: WorkspaceSize,
): WindowManagerState {
  if (state.openWindows.length !== 0 || !isPersistedLayoutValid(layout)) {
    return state;
  }

  const registeredIds = new Set(state.registeredApps.map((app) => app.appId));
  const retained = layout.openWindows.filter((window) => registeredIds.has(window.appId));

  let maxIndex = -1;
  for (const window of retained) {
    const index = windowIndex(window.id);
    if (index === null) {
      return state;
    }
    if (index > maxIndex) {
      maxIndex = index;
    }
  }
  if (layout.nextSequence <= maxIndex) {
    return state;
  }

  const constraintsFor = (appId: string): SizeConstraints => {
    const app = state.registeredApps.find((candidate) => candidate.appId === appId);
    return {
      minWidth: app?.minWidth ?? DEFAULT_MIN_WINDOW_WIDTH,
      minHeight: app?.minHeight ?? DEFAULT_MIN_WINDOW_HEIGHT,
    };
  };

  const openWindows: ManagedWindow[] = retained.map((window) => {
    const { minWidth, minHeight } = constraintsFor(window.appId);
    if (window.display === "maximized") {
      return {
        ...window,
        bounds: maximizeBounds(workspace),
        restoreBounds: window.restoreBounds
          ? clampBounds(window.restoreBounds, workspace, minWidth, minHeight)
          : null,
        displayBeforeMinimize: null,
      };
    }
    if (window.display === "minimized") {
      if (window.displayBeforeMinimize === "maximized") {
        return {
          ...window,
          bounds: maximizeBounds(workspace),
          restoreBounds: window.restoreBounds
            ? clampBounds(window.restoreBounds, workspace, minWidth, minHeight)
            : null,
        };
      }
      return {
        ...window,
        bounds: clampBounds(window.bounds, workspace, minWidth, minHeight),
        restoreBounds: null,
      };
    }
    return {
      ...window,
      bounds: clampBounds(window.bounds, workspace, minWidth, minHeight),
      restoreBounds: null,
      displayBeforeMinimize: null,
    };
  });

  let focusedWindowId: string | null = null;
  if (layout.focusedWindowId !== null) {
    const target = retained.find((window) => window.id === layout.focusedWindowId);
    if (target && target.display !== "minimized") {
      focusedWindowId = layout.focusedWindowId;
    }
  }
  if (focusedWindowId === null) {
    for (let index = openWindows.length - 1; index >= 0; index -= 1) {
      const window = openWindows[index];
      if (window && window.display !== "minimized") {
        focusedWindowId = window.id;
        break;
      }
    }
  }

  return {
    ...state,
    openWindows,
    focusedWindowId,
    nextSequence: layout.nextSequence,
  };
}