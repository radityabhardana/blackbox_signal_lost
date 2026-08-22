import type { TranslationKey } from "@/lib/locale/keys";

export type AppIconId =
  | "mail"
  | "messenger"
  | "records"
  | "evidence_board"
  | "objectives"
  | "signal_analyzer"
  | "conclusion"
  | "system_log"
  | "notifications"
  | "settings"
  | "help";

export const DEFAULT_WINDOW_WIDTH = 800;
export const DEFAULT_WINDOW_HEIGHT = 600;
export const DEFAULT_MIN_WINDOW_WIDTH = 320;
export const DEFAULT_MIN_WINDOW_HEIGHT = 240;

export interface WorkspaceSize {
  width: number;
  height: number;
}

export interface WindowBounds {
  x: number;
  y: number;
  width: number;
  height: number;
}

export type WindowDisplay = "normal" | "minimized" | "maximized";

export type RestorableDisplay = "normal" | "maximized";

export interface ApplicationDescriptor {
  appId: string;
  title: string;
  /** Locale key for the player-visible app title; UI renders this when present. */
  titleKey?: TranslationKey;
  minWidth?: number;
  minHeight?: number;
  /** When true, the launcher hides the app unless the case has unlocked it. */
  requiresUnlock?: boolean;
  /** Presentation-only icon id; consumers fall back to a generic glyph. */
  icon?: AppIconId;
}

export interface ManagedWindow {
  id: string;
  appId: string;
  display: WindowDisplay;
  bounds: WindowBounds;
  restoreBounds: WindowBounds | null;
  displayBeforeMinimize: RestorableDisplay | null;
}

export interface WindowManagerState {
  registeredApps: ApplicationDescriptor[];
  openWindows: ManagedWindow[];
  focusedWindowId: string | null;
  nextSequence: number;
}
