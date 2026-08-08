import { create } from "zustand";
import {
  closeWindow,
  createDesktop,
  focusWindow,
  minimizeWindow,
  moveWindow,
  openWindow,
  resetLayout,
  restoreWindow,
  resizeWindow,
  toggleMaximize,
} from "@/domain/windows";
import type { WorkspaceSize, WindowManagerState } from "@/domain/windows";
import { APP_CATALOG } from "@/lib/apps";

export interface WindowStore {
  manager: WindowManagerState;
  workspace: WorkspaceSize;
  setWorkspace: (workspace: WorkspaceSize) => void;
  open: (appId: string) => void;
  close: (id: string) => void;
  focus: (id: string) => void;
  minimize: (id: string) => void;
  restore: (id: string) => void;
  toggleMaximize: (id: string) => void;
  move: (id: string, x: number, y: number) => void;
  resize: (id: string, width: number, height: number) => void;
  resetWorkspace: () => void;
}

export const useWindowStore = create<WindowStore>()((set) => ({
  manager: createDesktop(APP_CATALOG),
  workspace: { width: 0, height: 0 },
  setWorkspace: (workspace) => set({ workspace }),
  open: (appId) => set((state) => ({ manager: openWindow(state.manager, appId, state.workspace) })),
  close: (id) => set((state) => ({ manager: closeWindow(state.manager, id) })),
  focus: (id) => set((state) => ({ manager: focusWindow(state.manager, id) })),
  minimize: (id) => set((state) => ({ manager: minimizeWindow(state.manager, id) })),
  restore: (id) => set((state) => ({ manager: restoreWindow(state.manager, id, state.workspace) })),
  toggleMaximize: (id) =>
    set((state) => ({ manager: toggleMaximize(state.manager, id, state.workspace) })),
  move: (id, x, y) =>
    set((state) => ({ manager: moveWindow(state.manager, id, x, y, state.workspace) })),
  resize: (id, width, height) =>
    set((state) => ({ manager: resizeWindow(state.manager, id, width, height, state.workspace) })),
  resetWorkspace: () => set((state) => ({ manager: resetLayout(state.manager, state.workspace) })),
}));

export function resetWindowStoreForTests(workspace: WorkspaceSize = { width: 1920, height: 1080 }) {
  useWindowStore.setState({ manager: createDesktop(APP_CATALOG), workspace });
}