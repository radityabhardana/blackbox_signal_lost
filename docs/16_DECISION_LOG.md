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

## ADR-016 — Authored search semantics (BBX-023)

**Status:** Accepted

**Decision:** BBX-023 searches only the authored `CaseManifest.searchableIndex` using one deterministic normalization policy: trim → `String.prototype.toLowerCase()` (no locale sensitivity) → replace runs of non-Unicode-letter/non-Unicode-number characters with a single space (`/[^\p{L}\p{N}]+/gu`) → collapse whitespace → trim. No diacritic folding, no stemming, no fuzzy matching. Each entry produces at most one candidate: tiers are compared as an ordered set (`exact_title > exact_term > alias > partial`), the first matching authored term wins inside a tier, and partial matching means the normalized authored `partialTerm` contains the normalized query. Ranking uses tier, then `authoredRank` descending, then declaration order. `availabilityRule` gates are evaluated by BBX-021 `evaluateRule` against the shared `RuleEvaluationContext`; `hidden` removes a gated candidate while `classified_placeholder` keeps its ranked position but is emitted as a sanitized `available:false` result exposing only `entityId`/`entityType`. Term collisions are allowed and never error.

**Context:** docs/08 §7 and docs/03 §5.3 define a deterministic authored pipeline (normalize, resolve aliases, match, check availability, rank exact-title/term/alias/partial) but leave numeric rank direction, exact normalization depth, partial-match direction, and gate-vs-`unavailableBehavior` behavior unspecified. docs/02 FR-006 requires results from authored metadata and progression rules.

**Options considered:**

- Diacritic folding / stemming / fuzzy or AI search (rejected: docs require deterministic authored search, no external engine).
- Partial direction reversed (authored term contained in query; rejected: query-contained-in-authored-term matches how users type prefixes and is recorded as the convention).
- Separate gate context interface (rejected: `RuleEvaluationContext` already is the minimal rule context; duplicating it would risk drift).
- Public numeric tier scores (rejected: tier precedence is compared as an ordered enum internally; public results expose no magic scores).

**Rationale:**

- Reusing `RuleEvaluationContext` and `evaluateRule` keeps BBX-021 authoritative for gates and avoids a second rule-context contract.
- A single candidate per entry plus one public `SearchResult` keeps results deterministic and matches the "one result per indexed entry" authoring model.
- `classified_placeholder` sanitization (no title/rank/term/tier) prevents authored-search metadata leaks through the public result, while retaining its internal sorted position.

**Consequences:**

- BBX-023 is a pure total function over validated `searchableIndex`; empty/no-match/hidden/classified paths return or omit without throwing.
- Organization/location entries are returned by authored id without dereferencing; BBX-024 still owns their reference integrity.
- Records/Mail UI, suggestion/correction (BBX-101), and search-event emission remain separate tasks.

---

## ADR-017 — IndexedDB save repository (BBX-030)

**Status:** Accepted

**Decision:** Persist game saves in IndexedDB through Dexie, behind the docs/08 §8 `SaveRepository` interface kept verbatim (`load/save/delete/list`). Each slot stores `{ current, previous? }` snapshots written in one transaction; `previous` is the last valid persisted snapshot (not a load history). Checksums are FNV-1a 32-bit over the UTF-8 bytes of the exact stored JSON payload — the checksum field itself is excluded from the checksummed payload and caller checksums are never authoritative. `SAVE_SCHEMA_VERSION = 1` is established by this BBX-030 convention; BBX-032 owns migrations.

**Context:** docs/08 §8 defines persistence (IndexedDB through Dexie) and save strategy (transactional write, checksum, versioned snapshots, previous known-good). docs/09 §14 leaves SaveGame's inner payloads (`sessionSnapshot`/`uiSnapshot`/`settings`/`gameEvents`) opaque; the envelope only verifies their structural shape, so the write boundary must independently guarantee JSON-safety.

**Options considered:**

- Replace the documented result shape with a `{ ok }` union (rejected: docs/08 §8 interface is preserved).
- Structured-clone the SaveGame object directly (rejected: storing `payloadJson` guarantees the stored form is JSON-only and cannot leak Set/Map/Date/class into IndexedDB).
- General "canonical JSON" canonicalization (rejected: a single exact `payloadJson` string owned by one codec is smaller and deterministic).
- Relying on BBX-013 layout/localStorage (rejected: layout authority stays with BBX-013; saves live in their own DB).

**Rationale:**

- Verifying the checksum before parsing keeps corrupted bytes untrusted until proven intact.
- Previous-known-good uses only validated persisted snapshots, so an interrupted or torn write can never be promoted to known-good.
- The JSON-safe write boundary runs before Zod re-validation so opaque records cannot hide non-JSON values that a parser would drop or coerce.
- `list()` uses the same effective-snapshot resolution as `load()` so a recoverable slot never silently disappears; summaries are ordered by `slotId` for determinism.

**Consequences:**

- BBX-030 is storage-only: no autosave coordinator (BBX-031), no migrations (BBX-032), no engine hydration/projection (later integration), no UI.
- Both adapters share one codec module to prevent semantic drift; an in-memory adapter exists for tests/dev with full parity.
- Dexie + fake-indexeddb are new runtime/dev dependencies; no other dependencies.

---

## ADR-018 — Autosave coordinator (BBX-031)

**Status:** Accepted

**Decision:** Introduce a small application/persistence coordinator bound to a single caller-supplied slot. `requestSave(reason)` marks new work and resets one trailing 800 ms debounce timer; the timer is trailing-only, re-armed on every request, and there is no maxWait/periodic guard. The snapshot is captured only at write-start via `getSnapshot()` so the newest caller state wins; multiple requests coalesce into the newest ready generation. At most one `repository.save` runs at a time; work arriving during a write receives another trailing window and never starts a concurrent save. A failed generation is marked blocked and never background-retried until a later `requestSave` (new generation) or an explicit `flush()`. `flush()` cancels the debounce, marks dirty work ready, drains generations immediately with fresh snapshots, and propagates the repository's exact rejection, without changing state. `dispose()` is synchronous, clears the timer, discards pending work, is a no-op for later calls, and neither cancels nor spawns writes.

**Context:** docs/02 requires locally autosaved progress without blocking interaction and preserving the previous valid save; docs/03 §5.11 lists autosave triggers (evidence discovery, objective completion, message choice, puzzle completion, report submission) plus "periodic idle debounce"; docs/12 lists BBX-031 as "Debounced and resilient". BBX-030 is authoritative for repository semantics (checksum, versions, known-good, storage).

**Options considered:**

- A fixed `maxWait`/periodic event (rejected: no normative interval; "idle debounce" does not require a starvation guard).
- Reason-dependent scheduling or accumulated reason history (rejected: `reason` is an explicit type-constrained signal only; timings are identical).
- A synchronous/blocking flush or browser lifecycle listeners (rejected: lifecycle wiring stays with the shell).
- Storing snapshots at request time (rejected: state can change during debounce and latest-state wins; capture-at-write removes stale writes).

**Rationale:**

- 800 ms is a project convention aligned with the existing BBX-013 layout hook; choosing it keeps behavior coherent without inventing a number.
- Generation tracking (requested/persisted/ready/blocked) makes single-flight, latest-state coalescing, and no-retry-after-failure provable with simple inequalities.
- The same repository promise is awaited by both background and flush paths, with a single settlement function mutating coordinator state (no double-settle, no unhandled rejections).

**Consequences:**

- No engine/rules imports, no checksum logic, no `Date.now`, no browser listeners, no localStorage/BBX-013, no UI.
- Slot switching is owned by the shell (new coordinator per slot). Restart-current-case is not part of BBX-031.
- A continuously streaming requester can keep `flush()` alive (documented barrier semantics, not a bug).

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