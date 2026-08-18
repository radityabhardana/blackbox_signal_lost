/**
 * Client-side DOM focus registry.
 *
 * Window-focus (focusedWindowId in the domain) is separate from DOM focus.
 * These helpers let activation flows (launcher, switcher, taskbar, window
 * controls) move DOM focus to a freshly shown window region or back to a
 * taskbar/launcher control.
 */

const windowRegions = new Map<string, HTMLElement>();
const taskbarItems = new Map<string, HTMLElement>();
let launcherButton: HTMLElement | null = null;

export function registerWindowRegion(id: string, element: HTMLElement): void {
  windowRegions.set(id, element);
}

export function unregisterWindowRegion(id: string): void {
  windowRegions.delete(id);
}

export function registerTaskbarItem(id: string, element: HTMLElement): void {
  taskbarItems.set(id, element);
}

export function unregisterTaskbarItem(id: string): void {
  taskbarItems.delete(id);
}

export function registerLauncherButton(element: HTMLElement): void {
  launcherButton = element;
}

export function unregisterLauncherButton(): void {
  launcherButton = null;
}

const schedule =
  typeof requestAnimationFrame === "function"
    ? (callback: () => void) => requestAnimationFrame(callback)
    : (callback: () => void) => window.setTimeout(callback, 0);

export function focusWindowRegion(id: string): void {
  schedule(() => windowRegions.get(id)?.focus());
}

export function focusTaskbarItem(id: string): void {
  schedule(() => taskbarItems.get(id)?.focus());
}

// The launcher button lives in the always-rendered Taskbar, so it is focused
// synchronously. Deferring via rAF let a stale callback fire after the player
// had already moved focus (e.g. reopened the launcher), stealing focus back
// and breaking keyboard operability under load.
export function focusLauncherButton(): void {
  launcherButton?.focus();
}