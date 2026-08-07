/**
 * Centralized design-token access for code.
 *
 * The CSS layer in `src/app/globals.css` is the source of truth; these
 * constants mirror the CSS custom properties so TypeScript code can reference
 * tokens without hardcoding values.
 */
export const theme = {
  colors: {
    bg0: "var(--bbx-bg-0)",
    bg1: "var(--bbx-bg-1)",
    surface1: "var(--bbx-surface-1)",
    surface2: "var(--bbx-surface-2)",
    text1: "var(--bbx-text-1)",
    text2: "var(--bbx-text-2)",
    accentCivic: "var(--bbx-accent-civic)",
    accentSignal: "var(--bbx-accent-signal)",
    danger: "var(--bbx-danger)",
    suppressed: "var(--bbx-suppressed)",
    success: "var(--bbx-success)",
  },
  zIndex: {
    base: "var(--z-bbx-base)",
    window: "var(--z-bbx-window)",
    taskbar: "var(--z-bbx-taskbar)",
    modal: "var(--z-bbx-modal)",
    notification: "var(--z-bbx-notification)",
  },
  motion: {
    durationFocus: "120ms",
    durationWindow: "160ms",
  },
} as const;
