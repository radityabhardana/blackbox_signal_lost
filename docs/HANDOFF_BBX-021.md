# Session Handoff — BBX-021 Rule Evaluator

**Task:** BBX-021 — pure, deterministic evaluation of the BBX-020 `RuleExpression` contract against a minimal runtime context. Conditions only; no effects or engine logic (BBX-022).

## Public API

```
evaluateRule(expression: RuleExpression, context: RuleEvaluationContext): boolean
```

- Pure, deterministic, side-effect-free, mutation-free.
- Independent of React, Zustand, browser APIs, persistence, current time, randomness, and global mutable state.
- Same expression + same context always returns the same result.
- Reuses the BBX-020 `RuleExpression` type (no duplicated union). Dependency direction: `content schemas → domain rules → future engine`.

## RuleEvaluationContext

```ts
interface RuleEvaluationContext {
  readonly flags: Readonly<Record<string, string | number | boolean>>;
  readonly events: readonly RuleEvent[];
  readonly discoveredEntities: ReadonlySet<string>;
  readonly completedObjectives: ReadonlySet<string>;
  readonly selectedChoices: ReadonlySet<string>;
}
```

### Event projection

```ts
interface RuleEvent {
  readonly type: string;
  readonly entityId?: string;
}
```

Minimal evaluator-facing projection (type + optional entityId). No timestamps, raw SaveGame, CaseManifest, UI/window, GameEffect, or counter state.

## Operator semantics

| Operator | Semantics |
|---|---|
| `always` | `true` |
| `all` | logical AND of children; `all([])` = `true`; short-circuit allowed |
| `any` | logical OR of children; `any([])` = `false`; short-circuit allowed |
| `not` | boolean inverse of the single child |
| `flagEquals` | `context.flags[key] === value`; strict equality, no coercion; missing flag → `false` |
| `eventOccurred` | true if any event has `type` equal; when `entityId` is provided the event must also match `entityId`; absent expression entityId leaves the event entity unconstrained; ordering irrelevant |
| `entityDiscovered` | true iff `discoveredEntities` contains the ID |
| `objectiveCompleted` | true iff `completedObjectives` contains the objective ID |
| `choiceSelected` | true iff `selectedChoices` contains the choice ID |
| `countAtLeast` | count of events with `type === eventType` (type-only filter, no entity); true iff `count >= threshold`; threshold 0 → true with empty history |

## Missing-data behavior

Missing runtime state is not malformed content: missing flag, absent membership, and no matching event all evaluate `false`. The evaluator never fabricates entities.

## Malformed-expression behavior

- Assumes input passed BBX-020 structural validation (no Zod re-validation inside the evaluator).
- An expression without exactly one documented operator, or an unhandled operator, throws a small internal `RuleEvaluatorError` (via an `unreachable` helper). There is no generic unknown-expression→false fallback that could hide a schema/integration defect.
- Validated content never reaches the unreachable branch.

## Determinism / immutability

- Reads only its arguments; builds no shared state; uses local `reduce`/`some`/`every` over the provided collections.
- `flags` and `events` are read-only by type; membership sets are `ReadonlySet` and never written.

## ADR-014 assumptions (docs were not explicit)

- `all([])` = true, `any([])` = false (conventional boolean semantics).
- Strict flag equality / no coercion.
- Missing runtime state = false.
- `eventOccurred` type + optional entityId AND matching; `countAtLeast` type-only counting.
- No artificial recursion limit (content is validated and trusted).
- docs/09 `RuleExpression` shape is authoritative over the inconsistent docs/08 `eventOccurred` example.

## BBX-022 deferrals

Not in BBX-021: GameEffect execution, trigger scheduling, trigger priorities, `once` semantics, case-state mutation, objective progression, dialogue queue, evidence-discovery mutation, application-unlock mutation, notification execution, event dispatch, and the deterministic engine loop.

## Validation evidence

- `pnpm lint` PASS
- `pnpm typecheck` PASS
- `pnpm test` — 36 files / 305 tests PASS
- `pnpm validate:content` PASS
- `pnpm test:e2e` PASS (4/4)
- `pnpm build` PASS
- No new dependencies; no changes to `src/content/schemas/**`, `src/content/validator/**`, or `scripts/validate-content.ts`.

**Known limitations / remaining BBX-021 issues:** none within scope; semantics gaps are explicitly recorded in ADR-014.
