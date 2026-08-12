# Session Handoff — BBX-022 Deterministic Case Engine

**Task:** BBX-022 — pure deterministic case engine owning one-step state transitions and GameEffect application, layered over BBX-021 rule evaluation and BBX-020 effect schemas.

## Public API

```
stepCaseEngine(state: CaseEngineState, input: EngineInput, content: ContentBundle): EngineResult
```

```
EngineResult = { state: CaseEngineState; appliedEffects: readonly GameEffect[] }
```

Also exported: `createInitialEngineState(): CaseEngineState`, `EngineError`.

- Pure, deterministic, mutation-free, JSON-state compatible. No React/Zustand/browser/persistence/Date/random/global state.
- One input per step; effects never re-trigger rule evaluation within a step (no fixed-point loop).

## Engine state (serializable)

```ts
interface CaseEngineState {
  flags: Record<string, string | number | boolean>;
  eventHistory: readonly RuleEvent[];
  discoveredEntityIds: readonly string[];      // generic entityDiscovered set
  unlockedRecords: readonly string[];
  unlockedApplications: readonly string[];
  activeObjectives: readonly string[];
  completedObjectives: readonly string[];
  selectedChoices: readonly string[];
  firedTriggerIds: readonly string[];
  queuedDialogue: readonly string[];            // output queue
  audioCues: readonly string[];                 // output queue
  notifications: readonly string[];             // output queue
}
```

- Directly `JSON.stringify`-compatible — no Set/Map. Unique-ID lists keep insertion order and never duplicate.
- Temporary `Set`s are built inside a step only for BBX-021 context projection and never returned.

## Input model

```ts
type EngineInput =
  | { kind: "game_event"; event: RuleEvent }
  | { kind: "evidence_discovered"; evidenceId: string }
  | { kind: "dialogue_choice_selected"; choiceId: string };
```

- This is an **engine input contract**, explicitly not the persisted SaveGame/GameEvent taxonomy (docs/09 GameEvent remains opaque; docs/08 §5 is non-normative). BBX-020 SaveGame/GameEvent is unmodified.
- Each input projects to exactly one `RuleEvent`: `game_event` → its event; `evidence_discovered` → `{ type: "evidence_discovered", entityId }`; `dialogue_choice_selected` → `{ type: "dialogue_choice_selected", entityId }`.

## Input processing order

1. Clone state (fresh arrays/records).
2. Append the input-derived `RuleEvent` to `eventHistory`.
3. Mirror input state: `evidence_discovered` → `discoveredEntityIds`; `dialogue_choice_selected` → `selectedChoices`.
4. For `dialogue_choice_selected`: resolve the choice from content (unknown → `EngineError`) and apply its consequences in authored order.
5. Evaluate eligible triggers (highest priority first, declaration-order ties; `once`-fired skipped).
6. Apply each firing trigger's effects in authored order.
7. Return fresh state + ordered `appliedEffects`.

## Trigger semantics

- **Higher numeric priority fires first**; equal priority → content declaration order (recorded in ADR-015; docs only define outcome priority direction).
- Every eligible matching trigger fires.
- `once: true`: skipped once its id is in `firedTriggerIds`; added after a successful fire. Non-`once` triggers may fire again on later steps.
- No fixed-point loop: a trigger is evaluated at most once per step.

## Rule-evaluator integration

- BBX-021 `evaluateRule` is authoritative; no rule semantics duplicated.
- Context per trigger built from current state: `flags`, `eventHistory`, `new Set(discoveredEntityIds)`, `new Set(completedObjectives)`, `new Set(selectedChoices)` — Sets are temporary only.

## Effect semantics

| Effect | Behavior |
|---|---|
| `unlock_record` | existence-check record; add uniquely to `unlockedRecords` |
| `unlock_application` | add uniquely to `unlockedApplications`; no existence check |
| `queue_dialogue` | existence-check node; append to `queuedDialogue` (dups allowed) |
| `start_objective` | existence-check; add to active only if not completed |
| `complete_objective` | existence-check; remove from active, add to completed |
| `set_flag` | `flags[key] = value`; idempotent |
| `discover_evidence` | existence-check; add to `discoveredEntityIds` |
| `play_audio_cue` | existence-check asset; append to `audioCues` (dups allowed) |
| `show_notification` | append to `notifications`; no existence check |

No effect is silently dropped.

## Objective lifecycle invariant

- `complete_objective` removes the id from `activeObjectives` before adding to `completedObjectives` — never both.
- `start_objective` on a completed objective is a no-op. Repeated operations are idempotent.

## appliedEffects contract

- Full ordered execution trace: choice consequences (authored order) then firing-trigger effects (priority → declaration → authored order).
- Includes idempotent no-op repeats (e.g., re-unlocking an already-unlocked record, setting a flag to its existing value). Consumers compare input/output state if they need change detection.

## Error model

- `EngineError` for integration defects only: unknown selected choice, unknown record/dialogue-node/objective/evidence/asset target.
- Not used for: rule-false, already-applied idempotent state, or application/notification targets (no registries yet — still applied per semantics, existence not checked).

## Determinism / serialization

- 39 tests cover JSON round-trip, no input mutation, identical repeated results, insertion-order uniqueness, and cross-step rule integration (eventOccurred/countAtLeast/objectiveCompleted/choiceSelected/entityDiscovered).

## Documentation

- ADR-015 records: serializable array state; EngineInput ≠ persisted GameEvent taxonomy; input-processing order; choice consequences before triggers; higher-priority-first; declaration ties; all matching triggers fire; once tracking; no fixed-point; generic `discoveredEntityIds`; active/completed exclusivity; queue duplicate behavior; appliedEffects full trace; target-check boundary; BBX-021 authoritative for rules.

## Validation evidence

- `pnpm lint` PASS · `pnpm typecheck` PASS · `pnpm test` 37 files / 344 PASS · `pnpm validate:content` PASS · `pnpm test:e2e` 4/4 PASS · `pnpm build` PASS.
- No new dependencies; `src/content/**`, `src/domain/rules/**`, `scripts/validate-content.ts` unchanged.

## Deferred

Search (BBX-023), persistence (BBX-030), Case 001 content (BBX-100), reachability (BBX-105), outcome engine (BBX-081), dialogue/notification/audio consumers (BBX-040/042/043), full GameEvent taxonomy.

**Known limitations / remaining BBX-022 issues:** none within documented scope. Application existence checks await the Application collection. Notification existence is proven statically by BBX-024 against NotificationDefinition (ADR-024); the engine intentionally performs no runtime notification lookup.
