# Session Handoff — Case 001 Stage 2 + BBX-070 Signal Analyzer

**Status:** Delivered. Production /game now plays the Stage 1 → Stage 2 investigation loop including the ferry-authenticity puzzle.

## Delivered

- Case 001 Stage 2 production content (same module, insertion-only): objective
  `obj_002_determine_authenticity`, signal_comparison puzzle
  `puzzle_001_ferry_authenticity` (4 properties; decisive = gate device +
  account signature; conclusion "injected through an administrative replay
  service"), evidence `ev_001_replay_signature`, baseline record
  `rec_001_ferry_baseline`, activation trigger (Stage 1 completion → unlock
  analyzer + start objective, same engine step) and completion trigger
  (puzzle_completed → discover evidence + complete objective + flag).
- BBX-070 Signal Analyzer: pure domain evaluator
  (`src/domain/signal-analyzer/evaluate.ts`) + production app
  (`app_signal_analyzer`) with comparison table, keyboard-accessible mark
  controls, incorrect/retry (no lives), and unlock gating.
- Generic unlock mechanism: `ApplicationDescriptor.requiresUnlock` +
  Launcher projection from `CaseEngineState.unlockedApplications`; analyzer
  also renders a locked state as defense-in-depth. Existing apps unaffected.
- Puzzle schema: `src/content/schemas/puzzles.ts` (`signal_comparison` kind,
  `ContentBundle.puzzles` default `[]`, EntityKind/validator/fixture wired).
- Production E2E: `e2e/case-001-stage-2.spec.ts` (fresh context → Stage 1
  discoveries → objectives transition → analyzer unlock → incorrect attempt →
  correct attempt → Stage 2 completion → solution evidence → note → reload →
  restored state); `e2e/case-001.spec.ts` assertions updated for the new
  dual-objective state.

## Ownership and boundaries

- Puzzle truth: authored content (`puzzles` collection). Evaluator: pure
  `src/domain/signal-analyzer`. App: presentation + user intent only.
- `CaseEngineState` remains the single progression authority (unlock,
  discovery, objectives, flags, events). No second puzzle-progress store.
- Persistence: unchanged SaveGame V2; all progression inside CaseEngineState.
  Analyzer selection/result is transient component state (not persisted).
- `SessionSaveRuntime`, `EvidenceBoardProvider`, Objective Tracker, and
  layout persistence keep their existing ownership.

## Incorrect/retry semantics

- Incorrect submission: no dispatch, generic feedback, selection retained,
  retry allowed. No lives/penalties/timers. No save corruption possible
  (nothing is written on an incorrect attempt).
- Correct submission: exactly one `game_event puzzle_completed` dispatch →
  authored effects discover evidence, complete objective, set flag → autosave
  via existing `evidence_discovered`/`objective_completed` paths.

## Validation

- Focused unit: Signal Analyzer evaluator 9 tests; Signal Analyzer app 8
  tests; Launcher unlock gating 2 new tests; Case 001 Stage 2 content +6
  tests (14 total).
- Full Vitest: 75 files, 724 tests passed.
- Full Playwright E2E: 14 passed (13 prior + 1 new Stage 1 → Stage 2 flow).
- `pnpm lint`, `pnpm typecheck`, `pnpm validate:content`, `pnpm build`, and
  `git diff --check` passed.

## Intentionally deferred

- Stage 3 tablet choice, Stage 4 suppression, Stage 5 masked contact,
  Stage 6 conclusion, endings (BBX-100 remainder; BBX-080/081/082).
- BBX-061 hint ladder UI, BBX-044 Timeline, BBX-051/052/053.
- BBX-071 generic Puzzle Adapter API (not needed for this slice).
- Transit Archive and Timeline unlock (docs/05 Stage 2 lists them; deferred).

## Recommended next task

- BBX-080 Conclusion Report (claims + evidence + disclosure) to continue the
  documented critical path BBX-050 → BBX-060 → BBX-100 → BBX-070 → BBX-080 →
  BBX-081, or Stage 3 content (BBX-100).
