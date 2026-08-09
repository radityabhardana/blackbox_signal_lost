# Session Handoff — BBX-031 Autosave Coordinator

**Task:** BBX-031 — debounced, resilient autosave coordination over the BBX-030 save repository. Launch/save only; no UI, hydration, restart, migrations, or engine integration.

## Public API

```ts
createAutosaveCoordinator({
  slotId: string,
  getSnapshot: () => SaveGame,
  repository: SaveRepository,
  debounceMs?: number,         // default AUTOSAVE_DEBOUNCE_MS (800)
  scheduler?: AutosaveScheduler // injectable; defaults to global setTimeout/clearTimeout
}): AutosaveCoordinator

interface AutosaveCoordinator {
  requestSave(reason: AutosaveReason): void;
  flush(): Promise<void>;
  dispose(): void;
  readonly isSaving: boolean;
  readonly hasPendingSave: boolean;
  readonly lastError: unknown | null;
}

type AutosaveReason =
  | "evidence_discovered"
  | "objective_completed"
  | "message_choice"
  | "puzzle_completed"
  | "report_submitted";
```

`AUTOSAVE_DEBOUNCE_MS = 800` (ADR-018 project convention; same number as BBX-013's existing layout hook). One coordinator per caller-provided `slotId`; slot switching creates a new coordinator via the shell.

## Debounce & semantics

- Trailing-edge only: `requestSave` increments the requested generation and resets one trailing timer. A burst coalesces to one save. No leading edge; no `maxWait`.
- `getSnapshot()` runs only when a write actually starts, so newest state always wins. BBX-030 validates `slotId === snapshot.slotId` itself; the coordinator just passes both through.
- The trailing debounce applies regardless of whether a save is in flight; a request during one gets its own full 800 ms window and then waits.

## Single-flight & failure model

- At most one `repository.save` is active; writes are chained via `readyGeneration > persistedGeneration` and never concurrent.
- A failed write records `lastError` (exact repository error, type `unknown | null` — never rewrapped) and marks its generation blocked; `hasPendingSave` stays true. The background path never auto-retries a failed generation; a later `requestSave` starts a fresh trailing window, or `flush()` retries the latest dirty generation once.
- Newer ready work that exists when an older write fails starts immediately (not considered a retry).

## flush / dispose

- `flush()`: resolves with no-op if idle/disposed. Else cancels the timer, marks dirty work ready, drains with fresh snapshots until `requestedGeneration === persistedGeneration` (requests arriving mid-drain are included), and rejects with the exact repository error while keeping the gen dirty. Never auto-retries inside one call; a subsequent `flush()` may retry.
- `dispose()`: synchronous; clears the timer; discards pending; later calls are no-ops; an in-flight write settles but schedules no follow-up; never calls `repository.save`.

## Files

- **Create**: `src/domain/saves/autosave-coordinator.ts`, `autosave-coordinator.test.ts`, `docs/HANDOFF_BBX-031.md`.
- **Modify**: `src/domain/saves/index.ts` (add coordinator exports), `docs/16_DECISION_LOG.md` (ADR-018).
- **Unchanged**: `src/content/**`, `src/infrastructure/persistence/**`, engine/rules/search/windows, `BBX-013`, UI, `package.json`, unrelated doc edits.

## Tests

19 focused tests (`autosave-coordinator.test.ts`) with fake timers and a controlled SaveRepository stub: trailing-debounce timing, reset-on-request, burst coalescing, all five reasons identical, snapshot captured only at write start and newest-state-correct, single-flight with follow-up, per-request trailing windows across in-flight saves, no concurrent writes, failed-generation no-auto-retry (incl. idle timers), retry-after-failure via new request, fail-then-newer-ready-work handoff, flush semantics + failure passthrough + explicit retry, dispose semantics, slot binding fidelity.

## Validation evidence

- `pnpm lint` PASS · `pnpm typecheck` PASS · `pnpm test` PASS · `pnpm validate:content` PASS · `pnpm test:e2e` PASS · `pnpm build` PASS. No new dependencies.

## Boundaries / remaining BBX-031 issues

- None within scope. Browser lifecycle wiring, restart current case, hydration, save UI, migrations (BBX-032), and engine integration are explicitly deferred.
