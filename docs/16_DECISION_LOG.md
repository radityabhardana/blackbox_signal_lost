# Architecture and Product Decision Log

This log records durable decisions. New entries should use the same format.

---

## ADR-001 — Web-first desktop interface

**Status:** Accepted

**Decision:** Build the first release for desktop web browsers.

**Rationale:**

- The operating-system interface naturally fits the browser.
- Sharing a playable link reduces friction.
- The project can later become an installable PWA or packaged desktop app.

**Consequences:**

- Desktop layout receives priority.
- Browser storage, loading, and compatibility require dedicated testing.
- Mobile receives a limited layout notice during the vertical slice.

---

## ADR-002 — Next.js and React for the shell

**Status:** Accepted

**Decision:** Use Next.js App Router, React, and TypeScript for the application shell and diegetic apps.

**Rationale:**

- Strong fit for interface-heavy applications
- Clear routing and deployment
- Good support for accessible components
- Suitable for AI-assisted development when architecture is documented

**Consequences:**

- Domain logic must remain separate from components.
- Client components should be limited to interactive boundaries.
- Heavy game modules must be lazy-loaded.

---

## ADR-003 — Phaser only for continuous-rendering modules

**Status:** Accepted

**Decision:** Do not build the desktop in Phaser. Use Phaser only for modules that benefit from a game loop.

**Rationale:**

- React is better for mail, records, forms, windows, and accessibility.
- Phaser is better for animated maps and game-like puzzles.
- Limiting Phaser lowers bundle and lifecycle complexity.

---

## ADR-004 — Authored deterministic narrative

**Status:** Accepted

**Decision:** Use authored case data and deterministic rules. No runtime generative AI in the MVP.

**Rationale:**

- Detective solutions require consistency and testability.
- Authored evidence enables fairness.
- Runtime generation increases safety, cost, and continuity risks.

---

## ADR-005 — Local-first save

**Status:** Accepted

**Decision:** Guest play and IndexedDB saves come before accounts and cloud synchronization.

**Rationale:**

- Reduces entry friction
- Enables offline-friendly development
- Prevents backend work from delaying the core game
- Preserves player privacy

---

## ADR-006 — Structured conclusion report

**Status:** Accepted

**Decision:** Players submit claims plus supporting evidence and a disclosure choice.

**Rationale:**

- Prevents random suspect selection from feeling equivalent to deduction
- Makes reasoning visible
- Supports multiple outcome dimensions

---

## ADR-007 — Fictional coastal city

**Status:** Accepted

**Decision:** Set the game in fictional Nusakara, inspired by Southeast Asian coastal infrastructure without directly portraying a real government.

**Rationale:**

- Creates visual and thematic identity
- Supports monsoon, flood-control, transit, and civic-data stories
- Avoids dependence on generic cyberpunk aesthetics

---

## ADR-008 — No morality meter

**Status:** Accepted

**Decision:** Do not display good/evil, trust, or ideology scores.

**Rationale:**

- Ethical choices should be interpreted through consequences.
- Numeric morality reduces ambiguity.
- Character trust should be communicated through behavior.

---

## ADR-009 — React Flow behind project adapters

**Status:** Accepted

**Decision:** Use React Flow for the evidence-board canvas but expose project-specific node and edge abstractions.

**Rationale:**

- Provides mature interaction primitives
- Avoids rebuilding pan, zoom, drag, and connections
- Adapter boundary reduces dependency lock-in

---

## ADR-010 — Local authored search

**Status:** Accepted

**Decision:** Use deterministic keyword and alias search. No embeddings or external search service in the vertical slice.

**Rationale:**

- Predictable
- Testable
- Localizable
- Works offline
- Prevents accidental answer leakage

---

## ADR-011 — One complete case before expansion

**Status:** Accepted

**Decision:** Complete Case 001 before adding accounts, chapter systems, user-generated content, or a full city simulation.

**Rationale:**

- The main risk is whether investigation is enjoyable.
- Additional systems do not validate the core loop.
- Scope discipline is essential for a small team.

---

## ADR-012 — BBX-012 satisfied by BBX-011 Session 3

**Status:** Accepted

**Decision:** Close BBX-012 (taskbar and launcher keyboard/pointer support) as a documentation-only task. No new implementation is required because BBX-011 Session 3 already delivered the taskbar, launcher, accessible window switcher, and their keyboard/pointer behaviour.

**Context:** The BBX-012 backlog item requested "keyboard and pointer support" for the taskbar and launcher. The AI execution playbook assigned these components to Session 3 (BBX-011) to enable the open, minimize, restore, and reset Playwright flow. An audit of the BBX-011 implementation confirmed all BBX-012 acceptance criteria are satisfied.

**Rationale:**

- Avoids reimplementing functionality that already exists.
- The custom accessible window switcher satisfies the documented "Alt+Tab or custom accessible switcher" requirement without OS-reserved shortcuts.
- Keeps work focused on the vertical-slice critical path.

**Consequences:**

- Taskbar and launcher keyboard/pointer support are considered complete.
- The notification center and settings shortcut remain listed as taskbar contents in `docs/07_UI_UX_SPEC.md` but are NOT completed by this closure; they stay assigned to the notification center backlog item (BBX-043) and the Settings milestone.

---

## ADR-013 — BBX-024 static content validation boundary

**Status:** Accepted

**Decision:** BBX-024 validates static content integrity only: global duplicate IDs for documented readable IDs, resolution of VALIDATE-class references, caseId relationships, objective/hint ownership, per-objective hint presence, and the required audio-transcript invariant. The validator is error-only, deterministic, and purely static. It does not evaluate RuleExpressions, execute GameEffects, simulate triggers/events, or prove runtime reachability.

**Context:** docs/09 §16 and docs/13 §3 list automated checks, but several of them (unreachable required records, impossible objectives, trigger cycles, outcome conflicts, every-ending-reachable) require rule/event semantics that only exist at runtime. docs/13 §3 explicitly assigns event-path traversal to a development simulation script, and docs/12 maps it to BBX-105 / BBX-100 Session 10.

**Options considered:**

- Implement full event-path reachability in BBX-024 (rejected: requires a RuleExpression evaluator, which belongs to the engine, and no documented static roots exist for the objective/dialogue/ending graphs).
- Add a warning severity (rejected: docs describe a failing build, not warnings; nothing consumes warnings).

**Rationale:**

- Reference IDs cannot be resolved yet for several documented fields because their target collections are intentionally opaque or undefined (CaseStage, ClaimSlot, Ending content, Application, Notification, Organization, Location, Channel, AssetBundle). Those are deferred, not guessed.
- "Missing hints" is enforced as at-least-one-hint per objective because docs/09 §9 requires only a complete ladder "before release"; four-tier completeness is BBX-104/105 content work, not a schema invariant.
- The reachability term in the backlog is honored, not redefined: BBX-024 implements static reference resolvability/integrity; the docs explicitly name a separate simulation script for runtime reachability.

**Consequences:**

- BBX-024 additions are all static and pure; the validator returns sorted error-only issues.
- Runtime/event-path reachability remains BBX-021/022, BBX-105, and BBX-100 Session 10.
- Future target collections added by BBX-080/100 must each add their own reference checks.

---

## ADR-014 — RuleExpression evaluation semantics

**Status:** Accepted

**Decision:** BBX-021 evaluates RuleExpression conditions against a minimal pure runtime context. Boolean composition uses conventional semantics: `all` is logical AND with `all([])` true, `any` is logical OR with `any([])` false, `not` inverts its single child. `flagEquals` uses strict equality with no coercion and missing flags evaluate false. `eventOccurred` matches any historical event by type, and by entityId only when the expression provides one. `countAtLeast` counts events by type only (no entity filter). Missing runtime state (flags, entities, objectives, choices, events) always evaluates false. No artificial recursion limit is imposed; content is BBX-020-validated and trusted.

**Context:** docs/09 §11 defines the operator set structurally but does not fully specify runtime semantics (empty-array behavior, equality rules, missing-state behavior). docs/08 §6's rule example writes `eventOccurred` in a string form (`{ "eventOccurred": "evidence_discovered", "entityId": "..." }`) that conflicts with the object form in docs/09 §11 (`{ eventOccurred: { type, entityId? } }`).

**Options considered:**

- Empty `all`/`any` as errors (rejected: nothing consumes a third state; conventional boolean semantics are deterministic and testable).
- Coercive flag comparison (rejected: docs define flags as string | number | boolean; strict equality prevents content from masking type mistakes).
- Re-running Zod validation inside the evaluator (rejected: BBX-020 already validates structure; the evaluator assumes validated input and surfaces impossible shapes via `RuleEvaluatorError`).

**Rationale:**

- Conventional boolean semantics are deterministic, side-effect-free, and match the declared closed operator set.
- docs/09 is the authoritative content schema (already shipped in BBX-020); its `eventOccurred` shape governs the evaluator.
- Returning false for missing runtime data keeps the evaluator total without inventing state.

**Consequences:**

- The evaluator never fabricates entities, never executes effects, and never mutates context; it is pure and deterministic.
- Malformed (non-validated) expression shapes throw `RuleEvaluatorError` instead of silently returning false.
- BBX-022 consumes `evaluateRule` for trigger conditions but owns scheduling, ordering, effects, and state mutation.
- The docs/08 eventOccurred example remains documentation debt to reconcile later.

---

## ADR-015 — Deterministic case-engine design (BBX-022)

**Status:** Accepted

**Decision:** BBX-022 processes one engine input per `stepCaseEngine` call into a fresh JSON-serializable state plus an ordered effect trace. Trigger priority uses **higher numeric value first** (consistent with the documented "highest priority wins" for outcomes in docs/09 §13, the only documented priority direction) with declaration-order ties; every eligible matching trigger fires; `once` triggers fire exactly once. There is no fixed-point re-evaluation loop — effects never re-trigger rules within the same step.

**Context:** docs/09 defines `priority: number` but not whether higher or lower means first; docs/11 Session 5 says "priority order" without a direction. docs/09 leaves GameEvent opaque and docs/08 §5's event union is a non-normative sketch. docs/13 requires the dialogue-choice-unlocks-record integration and notes trigger loops as a risk.

**Options considered:**

- Priority ascending (rejected: contradicts the documented outcome-priority direction).
- A fixed-point/re-evaluating loop (rejected: nothing requires it; sequential single-pass is deterministic and eliminates trigger loops by construction).
- Storing Sets/Maps in engine state (rejected: Session 5 requires directly serializable state; arrays + plain records are JSON.stringify-compatible).
- Reusing docs/08 §5's GameEvent union as the engine contract (rejected: non-normative and wide; BBX-022's smaller EngineInput is sufficient).

**Rationale:**

- `CaseEngineState` uses only plain records and strings/arrays — no Set/Map — so it round-trips through `JSON.stringify` with no serializer. Sets are built temporarily inside a step for BBX-021 rule evaluation and never returned.
- `EngineInput` (`game_event` / `evidence_discovered` / `dialogue_choice_selected`) is the engine's own typed input contract, not the persisted GameEvent taxonomy; each input projects to exactly one `RuleEvent`.
- Choice consequences execute before trigger evaluation so a choice that unlocks a record applies before any trigger that reads the resulting state.
- Objective lifecycle is mutually exclusive: `complete_objective` removes the id from `activeObjectives` before adding to `completedObjectives`; `start_objective` is a no-op on a completed objective.
- Queue effects (dialogue/audio/notification) append and allow duplicates; set/flag effects are idempotent. `appliedEffects` is the full ordered execution trace, including idempotent no-op repeats.
- Runtime existence checks are limited to targets resolvable in ContentBundle (record, dialogue node, objective, evidence, asset, dialogue choice). `applicationId`/`notificationId` are still applied but cannot yet be existence-checked because ContentBundle has no Application/Notification collection.

**Consequences:**

- The engine is pure, deterministic, mutation-free, and JSON-safe.
- BBX-021 remains authoritative for rule truth; BBX-020 remains authoritative for effect shapes.
- Later persistence (BBX-030), search (BBX-023), reachability (BBX-105), and content (BBX-100) consume this engine without changing its contract.
- References whose target collections do not yet exist remain documented deferrals, not dropped effects.

---

## Proposed-decision template

```text
## ADR-XXX — Title

Status: Proposed | Accepted | Rejected | Superseded

Decision:

Context:

Options considered:

Rationale:

Consequences:

Supersedes:
```