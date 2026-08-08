# Session Handoff — BBX-013 Layout Persistence

**Task:** BBX-013 — persist the window workspace so layout restores safely across reloads, without reimplementing the full save subsystem.

**Completed:**

- Added a small, pure domain hydration contract plus helper (`src/domain/windows/layout-hydration.ts`):
  - `PersistedWindowLayout` (openWindows, focusedWindowId, nextSequence) — the only data BBX-013 persists.
  - `isPersistedLayoutValid` — identity/semantic validation (win_N pattern, duplicate ids, finite geometry, display/restore combinations, non-negative safe-integer sequence). Intentionally: persistence layer and the store both pass through this.
  - `hydrateLayout(state, layout, workspace)` — hydrates only into an empty desktop; reconciles windows against `registeredApps` (catalog-evolution drops unknown appIds); clamps normal geometry / recomputes maximized bounds / clamps restoreBounds to the current `WorkspaceSize`; preserves display state (minimized, minimized-from-maximized with preserved restoreBounds); derives a valid `focusedWindowId` (fallback: last non-minimized) when the persisted focus is invalid; keeps `nextSequence` above every retained `win_N` index and never regresses a valid higher persisted sequence; never mutates inputs; returns the same state reference when rejected.
- Persistence layer:
  - `src/infrastructure/persistence/layout-schema.ts` — `LAYOUT_VERSION = 1`, `LAYOUT_STORAGE_KEY = "bbx.window.layout"`, Zod schema (finite numbers, enumerated display, non-negative int sequence), `serializeLayout`/`parseLayout` (JSON parse guard → schema → semantic validation → domain shape; invalid/foreign → `null`).
  - `src/infrastructure/persistence/layout-repository.ts` — `LayoutRepository` (`load`/`save`/`clear`) + `createLocalStorageLayoutRepository` with try/catch guards; quota/write errors keep previous value.
- Store: `window-store.ts` gains a `hydrateLayout(snapshot)` action that delegates to the domain function with the current workspace (adapter stays thin; no geometry/focus logic duplicated).
- Hydration lifecycle (`src/hooks/use-layout-persistence.ts`, mounted via `LayoutPersistence` in the game page):
  - Hydrates only once `WorkspaceSize` is non-zero (waits, re-checks on workspace changes).
  - Autosave stays disabled until the hydration decision completes, so the pristine initial desktop never overwrites a valid stored snapshot.
  - Trailing debounce (800 ms) writes the latest manager snapshot; `pagehide` and unmount flush any pending snapshot instead of discarding it.
  - Reset workspace is unchanged: `resetWorkspace -> resetLayout -> persistence observes the new manager -> reset layout is stored`. No storage-key deletion.
- Tests: domain hydration (16), schema/repository (11), store (5 hydration cases incl. no-op), hook lifecycle (6), plus the E2E suite (see below).

## Persistence boundary

Persisted: `openWindows` (ManagedWindow[]), `focusedWindowId`, `nextSequence`.

Not persisted: `registeredApps`, DOM refs, focus-registry internal, ResizeObserver state, launcher/switcher open state, transient drag/resize state, or any narrative/session/content.

## localStorage key / version

`bbx.window.layout` (single key), `LAYOUT_VERSION = 1`. Any JSON/version/schema/identity violation is treated as "no saved layout" and the desktop starts clean; the first later change writes a fresh valid snapshot; write failures are swallowed (previous value kept).

## Hydration lifecycle

1. Wait for non-zero measured workspace.
2. `repository.load()` → `PersistedWindowLayout | null` (invalid/malformed/missing → null).
3. If valid → `store.hydrateLayout`; else keep clean desktop. Either way autosave is enabled only after the decision.
4. Store changes → debounced save; `pagehide`/unmount flush pending.

## Semantic-validation rules

- Reject (safe clean start): malformed/non-finite geometry; non-neg-int `nextSequence`; non-`win_<n>` ids; duplicate ids; structurally impossible display/displayBeforeMinimize/restoreBounds states.
- Reconcile only on catalog evolution: unknown `appId` windows are dropped (their ids removed from sequence computation); if the persisted `nextSequence` is then < max retained `win_N`, restore is rejected.

## Reset semantics

Reset uses the same persisted-flow as any other change — no storage deletion is triggered by reset; after `resetWorkspace()` the equal reset layout becomes the stored snapshot.

## BBX-030 migration boundary

BBX-013 Kodzi uses localStorage only for a tiny layout snapshot. BBX-030 owns: IndexedDB/Dexie save repository, full SaveGame (with `uiSnapshot`), checksums, transactional slots, migration repository, previous-known-good infrastructure. Those are NOT implemented here.

## Known limitations / risks

- Workspace-resize handling re-clamping only happens at hydration time (initial restore + reset); a live shrink without interaction keeps windows as-is until next action (BBX-011 semantics preserved).
- `hydrateLayout` requires an empty target desktop; it no-ops otherwise.
- Catch: the e2e flow needs windows positioned to avoid overlap for control clicks (worked around in `e2e/layout-persistence.spec.ts`).
- Focus is intentionally not moved in the DOM on restore (visual only) to avoid stealing screen-reader/user focus on load.

## Tests / validation

- `pnpm lint`, `pnpm typecheck` (strict, no new TS), `pnpm test` 159/159, `pnpm test:e2e` 4/4 (incl. window-manager + smoke), `pnpm build` exit 0.
- E2E: open→drag Mail→open Records→minimize Records→poll localStorage (no sleeps)→reload→verify moved+minimized→Reset→poll→reload→verify all-normal→inject malformed key→clean start and recovery→no pageerror.
- New tests: `layout-hydration.test.ts`, `layout-repository.test.ts` (schema+repository), hook test, store hydration cases; setup gains a jsdom localStorage / PointerEvent polyfill.

**Save / schema impact:** none beyond the `bbx.window.layout` snapshot; no narrative or content state is persisted.

**Next recommended task:** BBX-020 — Zod content schemas (then the full BBX-030 IndexedDB save repository).