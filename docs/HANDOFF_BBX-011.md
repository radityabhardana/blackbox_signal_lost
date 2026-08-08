# Session Handoff — BBX-011 Window Manager UI

**Task:** BBX-011 — connect the tested BBX-010 window-manager domain to accessible React UI.

**Completed:**

- Thin Zustand adapter `src/stores/window-store.ts` wrapping every BBX-010 transition (`open`, `close`, `focus`, `minimize`, `restore`, `toggleMaximize`, `move`, `resize`, `resetWorkspace`) with the measured workspace supplied per call. No window/geometry state reimplemented in React.
- Desktop surface measures its own box via `useWorkspaceSize` (ResizeObserver) and records it in the store.
- Window layer renders `openWindows` in array (stacking) order; minimized windows are not rendered; focused window is visually accented via `bbx-window-focused`.
- Accessible window frame and title bar: `section` labelled by the title heading, semantic window controls (minimize / maximize-restore / close) with aria-labels, double-click title bar toggles maximize, title-bar pointer-drag (Pointer Events + capture), southeast resize handle announced as a labelled `button` with pointer drag and keyboard arrow resizing.
- Launcher with four inert placeholders (Mail, Messenger, Records, System Log): real button trigger, `aria-expanded`/`aria-controls`, `role="menu"`, arrow-key navigation, Enter/Space activation, Escape returns focus to the trigger.
- Taskbar shows open/minimized/focused windows as indicators (click = focus; minimized = restore), plus a Reset workspace button and the existing case status + system time.
- Explicit keyboard-accessible Window Switcher (`Switch window` button) replacing Alt+Tab: lists non-minimized windows, arrow navigation, Enter/Space activation, Escape dismisses without closing applications, DOM focus moved to the activated window region.
- DOM focus kept separate from BBX `focusedWindowId`; a small focus registry (`src/lib/focus-registry.ts`) moves DOM focus to window regions/taskbar items/launcher on activation, after minimize/close, or back to a sensible control.
- Reduced-motion: window entrance animation is duration-based CSS (neutralized by the existing `prefers-reduced-motion` override); no JS-driven animation.
- Placed all chrome classes and window motion under `src/app/globals.css` using only existing `--bbx-*` tokens and the centralized z-index scale.
- Tests: store adapter, window layer, window frame, resize handle, launcher, taskbar, window switcher, workspace-size hook; plus a Playwright flow covering open → minimize → restore → max/unmaximize → reset workspace with a pageerror guard.

**Files:**

- New: `src/stores/window-store.ts`, `src/lib/apps.ts`, `src/lib/focus-registry.ts`, `src/hooks/{use-workspace-size,use-pointer-drag}.ts`, `src/components/windows/{window-layer,managed-window,window-frame,window-controls,window-content,resize-handle}.tsx`, `src/components/desktop/{launcher,window-switcher,taskbar-app-item,taskbar-app-items}.tsx`; tests in `src/stores`, `src/components/windows`, `src/components/desktop`, `src/hooks`; `e2e/window-manager.spec.ts`.
- Modified: `src/components/desktop/workspace-shell.tsx` (now client, measures workspace, renders `WindowLayer`), `src/components/desktop/taskbar.tsx` (functional launcher/switcher/reset), `src/app/globals.css`, `vitest.setup.ts` (jsdom `PointerEvent` fallback only).

**Tests:** `pnpm lint`, `pnpm typecheck`, `pnpm test` (119 unit/component), `pnpm test:e2e` (smoke + window-manager flow), `pnpm build`. All pass.

**Decisions:**

- Windows are stacked by DOM order (render `openWindows` in array order); no per-window z-index values are introduced. Taskbar stays on `z-bbx-taskbar`, launcher/switcher menus on `z-bbx-modal`.
- Live `WorkspaceSize` changes only update the recorded workspace; existing windows are re-clamped on their next domain interaction. Persistent re-clamping/persistence is deliberately deferred to BBX-013 (documented limitation, not duplicated geometry logic).
- Window switcher is an explicit taskbar control (no Alt+Tab capture) to avoid OS/browser-reserved shortcuts.
- Launcher always opens a new window instance (domain multi-instance model); focusing an already-open app is not special-cased.

**Known issues:**

- Not committed (per instruction).
- `getFocusedWindow`'s `?? ""` quirk from BBX-010 remains (unchanged).
- A desktop window may be temporarily off-viewport until its next interaction after the browser is resized smaller; resolved via `Reset workspace`.

**Save / schema impact:** None — BBX-011 adds no persistence. `WindowManagerState` remains the future serialization contract for BBX-013.

**Next recommended task:** BBX-013 — layout persistence (restore/reset safely through the existing BBX-010 domain), then BBX-020 content schemas.