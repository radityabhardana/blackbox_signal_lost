import {
  clampBounds,
  getDefaultWindowBounds,
  maximizeBounds,
} from "./geometry";
import type {
  ApplicationDescriptor,
  ManagedWindow,
  RestorableDisplay,
  WindowManagerState,
  WorkspaceSize,
} from "./types";

export function createDesktop(registeredApps: ApplicationDescriptor[] = []): WindowManagerState {
  return {
    registeredApps,
    openWindows: [],
    focusedWindowId: null,
    nextSequence: 0,
  };
}

export function registerApp(
  state: WindowManagerState,
  app: ApplicationDescriptor,
): WindowManagerState {
  const isRegistered = state.registeredApps.some((candidate) => candidate.appId === app.appId);
  if (isRegistered) {
    return state;
  }
  return { ...state, registeredApps: [...state.registeredApps, app] };
}

export function openWindow(
  state: WindowManagerState,
  appId: string,
  workspace: WorkspaceSize,
): WindowManagerState {
  const app = state.registeredApps.find((candidate) => candidate.appId === appId);
  if (!app) {
    return state;
  }
  const id = `win_${state.nextSequence}`;
  const window: ManagedWindow = {
    id,
    appId,
    display: "normal",
    bounds: getDefaultWindowBounds(workspace, app.minWidth, app.minHeight),
    restoreBounds: null,
    displayBeforeMinimize: null,
  };
  return {
    ...state,
    openWindows: [...state.openWindows, window],
    focusedWindowId: id,
    nextSequence: state.nextSequence + 1,
  };
}

export function closeWindow(state: WindowManagerState, id: string): WindowManagerState {
  if (!findManagedWindow(state, id)) {
    return state;
  }
  const openWindows = state.openWindows.filter((entry) => entry.id !== id);
  return {
    ...state,
    openWindows,
    focusedWindowId: deriveFocusedId(openWindows),
  };
}

export function focusWindow(state: WindowManagerState, id: string): WindowManagerState {
  if (state.focusedWindowId === id) {
    return state;
  }
  const target = findManagedWindow(state, id);
  if (!target || target.display === "minimized") {
    return state;
  }
  return {
    ...state,
    openWindows: raiseToTop(state.openWindows, id),
    focusedWindowId: id,
  };
}

export function minimizeWindow(state: WindowManagerState, id: string): WindowManagerState {
  const target = findManagedWindow(state, id);
  if (!target || target.display === "minimized") {
    return state;
  }
  const displayBeforeMinimize: RestorableDisplay = target.display;
  const openWindows = state.openWindows.map((entry) =>
    entry.id === id
      ? { ...entry, display: "minimized" as const, displayBeforeMinimize }
      : entry,
  );
  return {
    ...state,
    openWindows,
    focusedWindowId: deriveFocusedId(openWindows),
  };
}

export function restoreWindow(
  state: WindowManagerState,
  id: string,
  workspace: WorkspaceSize,
): WindowManagerState {
  const target = findManagedWindow(state, id);
  if (!target || target.display !== "minimized") {
    return state;
  }
  if (target.displayBeforeMinimize === "maximized") {
    return applyRaised(state, id, {
      ...target,
      display: "maximized",
      bounds: maximizeBounds(workspace),
      displayBeforeMinimize: null,
    });
  }
  const { minWidth, minHeight } = appConstraints(state, target.appId);
  return applyRaised(state, id, {
    ...target,
    display: "normal",
    bounds: clampBounds(target.bounds, workspace, minWidth, minHeight),
    restoreBounds: null,
    displayBeforeMinimize: null,
  });
}

export function maximizeWindow(
  state: WindowManagerState,
  id: string,
  workspace: WorkspaceSize,
): WindowManagerState {
  const target = findManagedWindow(state, id);
  if (!target || target.display !== "normal") {
    return state;
  }
  return applyRaised(state, id, {
    ...target,
    display: "maximized",
    bounds: maximizeBounds(workspace),
    restoreBounds: { ...target.bounds },
  });
}

export function unmaximizeWindow(
  state: WindowManagerState,
  id: string,
  workspace: WorkspaceSize,
): WindowManagerState {
  const target = findManagedWindow(state, id);
  if (!target || target.display !== "maximized") {
    return state;
  }
  const origin = target.restoreBounds ?? getDefaultWindowBounds(workspace);
  const { minWidth, minHeight } = appConstraints(state, target.appId);
  return applyRaised(state, id, {
    ...target,
    display: "normal",
    bounds: clampBounds(origin, workspace, minWidth, minHeight),
    restoreBounds: null,
  });
}

export function toggleMaximize(
  state: WindowManagerState,
  id: string,
  workspace: WorkspaceSize,
): WindowManagerState {
  const target = findManagedWindow(state, id);
  if (!target) {
    return state;
  }
  if (target.display === "maximized") {
    return unmaximizeWindow(state, id, workspace);
  }
  if (target.display === "normal") {
    return maximizeWindow(state, id, workspace);
  }
  return state;
}

export function moveWindow(
  state: WindowManagerState,
  id: string,
  x: number,
  y: number,
  workspace: WorkspaceSize,
): WindowManagerState {
  const target = findManagedWindow(state, id);
  if (!target || target.display !== "normal") {
    return state;
  }
  const { minWidth, minHeight } = appConstraints(state, target.appId);
  return applyRaised(state, id, {
    ...target,
    bounds: clampBounds({ ...target.bounds, x, y }, workspace, minWidth, minHeight),
  });
}

export function resizeWindow(
  state: WindowManagerState,
  id: string,
  width: number,
  height: number,
  workspace: WorkspaceSize,
): WindowManagerState {
  const target = findManagedWindow(state, id);
  if (!target || target.display !== "normal") {
    return state;
  }
  const { minWidth, minHeight } = appConstraints(state, target.appId);
  return applyRaised(state, id, {
    ...target,
    bounds: clampBounds({ ...target.bounds, width, height }, workspace, minWidth, minHeight),
  });
}

export function resetLayout(
  state: WindowManagerState,
  workspace: WorkspaceSize,
): WindowManagerState {
  if (state.openWindows.length === 0) {
    return state;
  }
  const openWindows = state.openWindows.map((entry) => {
    const { minWidth, minHeight } = appConstraints(state, entry.appId);
    return {
      ...entry,
      display: "normal" as const,
      bounds: getDefaultWindowBounds(workspace, minWidth, minHeight),
      restoreBounds: null,
      displayBeforeMinimize: null,
    };
  });
  return {
    ...state,
    openWindows,
    focusedWindowId: deriveFocusedId(openWindows),
  };
}

export function getFocusedWindow(state: WindowManagerState): ManagedWindow | null {
  return findManagedWindow(state, state.focusedWindowId ?? "") ?? null;
}

function findManagedWindow(state: WindowManagerState, id: string): ManagedWindow | undefined {
  return state.openWindows.find((entry) => entry.id === id);
}

function raiseToTop(windows: ManagedWindow[], id: string): ManagedWindow[] {
  const target = windows.find((entry) => entry.id === id);
  if (!target) {
    return windows;
  }
  return [...windows.filter((entry) => entry.id !== id), target];
}

function deriveFocusedId(windows: ManagedWindow[]): string | null {
  for (let index = windows.length - 1; index >= 0; index -= 1) {
    const entry = windows[index];
    if (entry && entry.display !== "minimized") {
      return entry.id;
    }
  }
  return null;
}

function applyRaised(
  state: WindowManagerState,
  id: string,
  next: ManagedWindow,
): WindowManagerState {
  const openWindows = raiseToTop(
    state.openWindows.map((entry) => (entry.id === id ? next : entry)),
    id,
  );
  return { ...state, openWindows, focusedWindowId: id };
}

function appConstraints(
  state: WindowManagerState,
  appId: string,
): { minWidth?: number; minHeight?: number } {
  return state.registeredApps.find((app) => app.appId === appId) ?? {};
}