# Session Handoff — BBX-010 Window Manager Domain

**Task:** BBX-010 — Window domain model (pure tested geometry and focus rules).

**Completed:**

- Created `src/domain/windows/` as a pure TypeScript domain module (no React, no browser globals, no Zustand) with an index barrel.
- `types.ts`: `WorkspaceSize`, `WindowBounds`, `WindowDisplay`, `RestorableDisplay`, `ApplicationDescriptor` (optional `minWidth`/`minHeight`), `ManagedWindow` (with `restoreBounds` and `displayBeforeMinimize`), `WindowManagerState`; constants `DEFAULT_WINDOW_WIDTH/HEIGHT` (800×600) and `DEFAULT_MIN_WINDOW_WIDTH/HEIGHT` (320×240).
- `geometry.ts`: `clampBounds` (min-size and workspace clamping, effective min = `min(appMin, workspace)`, valid zero geometry for empty workspaces), `getDefaultWindowBounds`, `maximizeBounds`.
- `transitions.ts`: pure, immutable transitions — `createDesktop`, `registerApp`, `openWindow` (deterministic `win_${nextSequence}` ids, unregistered app = no-op), `closeWindow`, `focusWindow` (raises to top; minimized cannot be focused), `minimizeWindow`, `restoreWindow` (returns to `displayBeforeMinimize`, preserves `restoreBounds` across minimize), `maximizeWindow` (only from normal), `unmaximizeWindow` (exact previous bounds, clamped), `toggleMaximize`, `moveWindow`/`resizeWindow` (only for normal display, clamped, raise-to-top), `resetLayout` (normalizes all windows, preserves order and `nextSequence`), `getFocusedWindow`.
- No-op operations return the same state reference; changing operations return new references and never mutate input.
- `src/test/fixtures/windows.ts`: `TEST_APPS` (`app_mail`, `app_records`, `app_min` with 1000×700 min), `WORKSPACE` (1920×1080), `TINY_WORKSPACE` (200×150), `ZERO_WORKSPACE` (0×0), `deepFreeze` helper.
- Tests: `geometry.test.ts` (14) and `transitions.test.ts` (56) covering registration, deterministic ids, sequence survival after close-all, focus ordering, minimized exclusion from focus, minimize/close focused + non-focused + final, normal→minimize→restore, normal→maximize→unmaximize (exact bounds), normal→maximize→minimize→restore, move/resize clamping, invalid-display no-ops, tiny/zero workspaces, resetLayout, frozen-input immutability.

**Files:**

- Added: `src/domain/windows/{types,geometry,transitions,index}.ts`, `src/domain/windows/{geometry,transitions}.test.ts`, `src/test/fixtures/windows.ts`

**Tests:** `pnpm lint`, `pnpm typecheck`, `pnpm test` (78 unit — 14 geometry + 56 transitions + 8 existing), `pnpm build`. All pass. E2E not re-run (no UI change).

**Decisions:**

- Single-window operations (`close`, `focus`, `minimize`, `restore`, `maximize`, `unmaximize`, `toggle`, `move`, `resize`) target a window `id`, not an `appId`, because the model allows multiple windows per app; the taskbar layer can map app → window later.
- `registerApp` is a no-op (same reference) for a duplicate `appId`.
- Restore of a maximized-before-minimize window keeps `restoreBounds` so a later unmaximize returns to the original normal geometry; restore-to-normal clears both `restoreBounds` and `displayBeforeMinimize`.
- Focus is always the last non-minimized window in `openWindows`; closing/minimizing re-derives it from the remaining windows.
- `resetLayout` returns the same reference when no windows are open; otherwise it normalizes every window and focuses the last one while preserving `registeredApps` and `nextSequence`.
- Type-only imports use `import type` in the domain module.

**Known issues:**

- `getFocusedWindow` uses `state.focusedWindowId ?? ""` internally to avoid an empty-string lookup on null; harmless but slightly inelegant — acceptable for now.
- Not committed; `nextSequence` starts at 0, so the first window id is `win_0`.
- No workspace-change handling beyond `resetLayout`; live viewport resizing while windows are open is deferred to the UI milestone (BBX-011).

**Save / schema impact:** None yet — domain state is not persisted; `WindowManagerState` is the future serialization contract.

**Next recommended task:** BBX-011 — Window UI (move, resize, minimize, restore, maximize) consuming this domain model.
