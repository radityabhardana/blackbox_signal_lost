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

- Reference IDs cannot be resolved yet for several documented fields because their target collections are intentionally opaque or undefined (CaseStage, ClaimSlot, Ending content, Application, Organization, Location, Channel, AssetBundle). Those are deferred, not guessed. (Update post-ADR-024: `Notification` is no longer in this list — `NotificationDefinition` exists and `show_notification` is now a validated reference class.)
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
- Runtime existence checks are limited to targets resolvable in ContentBundle (record, dialogue node, objective, evidence, asset, dialogue choice). `applicationId`/`notificationId` are still applied at runtime without engine existence checks; as of ADR-024 the `notificationId` reference is proven statically by BBX-024 against the NotificationDefinition collection (`applicationId` still awaits its defining collection).

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

**Decision:** Persist game saves in IndexedDB through Dexie, behind the docs/08 §8 `SaveRepository` interface kept verbatim (`load/save/delete/list`). Each slot stores `{ current, previous? }` snapshots written in one transaction; `previous` is the last valid persisted snapshot (not a load history). Checksums are FNV-1a 32-bit over the UTF-8 bytes of the exact stored JSON payload — the checksum field itself is excluded from the checksummed payload and caller checksums are never authoritative. BBX-030 established the original `SAVE_SCHEMA_VERSION = 1` storage convention; ADR-019 supersedes that version as the current format and records the implemented V1→V2 migration.

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

- BBX-030 remains storage-only: no autosave coordinator (BBX-031), no runtime hydration/projection, and no UI. Migration was later added by BBX-050A3a under ADR-019.
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

## ADR-019 — Save migration V1 to V2 (BBX-032)

**Status:** Accepted — Implemented at the format layer by BBX-050A3a; runtime hydration remains deferred to BBX-050A3b

**Decision:** BBX-032 owns explicit SaveGame migrations keyed only by `saveSchemaVersion`; `contentVersion` and `applicationVersion` remain preserved metadata, never migration keys. A3a introduces the first real transition, V1→V2, and sets `SAVE_SCHEMA_VERSION = 2`. V2 stores a typed session envelope containing `CaseEngineState` and `EvidenceBoardSnapshotV1`. Empty historical V1 session snapshots migrate to canonical fresh engine/board state. Non-empty opaque V1 session snapshots fail closed as `unsupported_version`; they are never discarded or reinterpreted. Runtime hydration and persistence wiring remain deferred to BBX-050A3b.

**Context:** docs/12 assigns BBX-032 "P1 | Tests across schema versions". docs/13 §6 states: "Never ship a migration without fixtures from the previous supported version." A3a freezes explicit empty and non-empty V1 fixtures and places version discovery between checksum verification and current-schema validation so historical candidates can reach the migration boundary.

**Rationale (documented future behavior):**

- **Future candidate read pipeline** (per snapshot): checksum verification → `JSON.parse` into unknown → minimally extract/validate `saveSchemaVersion` → if current version: no migration → if older with a complete registered path: validate against that version's own historical schema, then migrate sequentially through real steps → validate the final output with the **current** `saveGameSchema` → return trusted current SaveGame. An old save must NOT be required to pass the current SaveGame schema before migration.
- **Previous-known-good with future migration:** candidates are tried in order `current`, then `previous`, and each runs the full pipeline independently (checksum → parse-unknown → version discovery → supported migration → current-schema validation). A candidate becomes usable only when that entire chain passes.
- **Version taxonomy:** `CURRENT` (`version === SAVE_SCHEMA_VERSION`) → no migration; `OLDER` with a complete real path → sequential migration; `OLDER` without a path → `unsupported_version`; `FUTURE` > current → `unsupported_version`; missing/malformed discriminator → `corrupt`. Version 0 is syntactically possible but not a historical format and stays unsupported unless a real v0 contract ever exists.
- **Migration step model:** A3a implements the real V1→V2 migration in `src/domain/saves/save-migration.ts`. Future transitions must add another real step; no identity migration is used.

**Consequences:** BBX-032's format-layer acceptance is complete for V1→V2. A3b still owns loading a trusted V2 value into runtime providers and must not write migrated data back during load. Future transitions must preserve this checksum-first, version-discovery, migration, and final-current-schema validation order.

---

## ADR-020 — Non-sensitive debug export (BBX-033)

**Status:** Accepted

**Decision:** BBX-033 provides a pure domain debug report containing exactly the six documented diagnostic categories from docs/08 §13: application version, save schema version, content version, recent domain event-type codes, browser capability summary (`indexedDB` + `serviceWorker`, fixed fields, never an arbitrary map), and error codes. `saveSchemaVersion` is imported from `SAVE_SCHEMA_VERSION`; `contentVersion`/`applicationVersion` are preserved exactly as supplied by the caller; events are caller-supplied type-code strings filtered to the shape `^[a-z0-9_-]{1,64}$`, in chronological order, duplicates kept, last 16 valid entries retained. `errorCodes` is typed `SaveRepositoryErrorCode[]` reused directly. There is no raw-error ingestion, no payload data, no timestamp, no UI/download, no analytics, no persistence access.

**Context:** docs/12 BBX-033 ("Non-sensitive diagnostics"); docs/08 §12 logs "a non-sensitive diagnostic code" only; docs/08 §13 lists the six exportable data points; docs/15 requires guest mode to store only local data with no unnecessary personal data and no analytics by default. BBX-032 format migration is implemented; migration status remains outside the debug export contract.

**Options considered:**

- Arbitrary capability/string maps (rejected: keys themselves leak data; fixed fields prevent it).
- Accepting whole `Error` instances or `Error.message` (rejected: uncontrolled content; the owning boundary maps to the documented code instead).
- Deduplicating recent events (rejected: duplicates are meaningful: occurrence frequency is a real diagnostic signal).
- Max-count/length caps (chosen as BBX-033 export-safety conventions — **16 entries / 64 chars**, docs silent — recorded here on purpose, not engine semantics).

**Rationale:**

- A fixed report shape and explicit two-field capability object make the whole surface enumerable and testable; nothing opaque or fingerprintable enters.
- Calling `JSON.stringify` produces stable output only because the serializer explicitly re-projects the six approved fields (and the fixed `{indexedDB, serviceWorker}` capability object) from the report — the serializer is itself a privacy choke point, so runtime extras on an externally-forged/cast report are discarded, never stringified.
- Sensitivenegative tests target only the filtered input paths; allowed opaque version metadata is intentionally passed through.

**Consequences:**

- The module is a pure, total, deterministic builder beside `src/domain/diagnostics`.
- It never reads stores/engines/repositories and never touches browser APIs, `Date`, or `Math.random`.
- Download/share UI remains a later integration task; BBX-032 format migration is implemented and remains decoupled from the debug export.

---

## ADR-021 — Secure Mail vertical slice reuses DialogueNode with a session-owned engine boundary (BBX-040)

Status: Accepted

Decision:

BBX-040 reuses the existing BBX-020 DialogueNode as the authored mailbox message vehicle behind a configurable mail channelId.

- No new Mail schema — docs/09 defines none; mailbox metadata (subject, caseLabel, trust) is a documented content-model gap.
- Inbox rows derive strictly from CaseEngineState.queuedDialogue, filtered by channel, preserving queue order exactly. Messages are never sourced from all authored dialogue.
- Sender = Character.displayName via speakerId; body = node.text; sentAtNarrativeTime shown only when authored.
- Read state (selected/read IDs) is Mail-local React state, non-persistent.
- Attachment presentation uses only real Asset fields (altText, type, transcriptPath is presence-only). No fetching, no dangerouslySetInnerHTML.
- Evidence association uses the existing reverse relation Evidence.assetIds contains asset.id; 0/1/many deterministic semantics in declaration order; no evidence duplicated on repeat activation.
- Progress integrates only through CaseSessionProvider -> stepCaseEngine. dispatchTransaction plans against the authoritative closure-held engine state (fresh read, never stale render state), folds inputs sequentially, and commits once — rapid repeat activation cannot duplicate evidence_discovered.

Context:

docs/12 BBX-040 ("Attachments and evidence events"); docs/11 Session 7 requires fixture content, attachments, evidence discovery, keyboard behavior, empty/error states, and tests. BBX-022 owns progression and its queueDialogue + discover semantics; docs/09 defines no mail entity.

Rationale:

- CaseSessionState stays authoritative in the session; Mail never mutates engine state directly.
- Multiple Evidence entries sharing one asset are all processed sequentially against freshly returned engine state.
- A Playwright-only harness route (/test/mail) gates on PLAYWRIGHT_TEST=1 and mounts the real desktop shell; production /game never imports test fixtures.
- DialogueChoice.nextNodeId remains unconsumed by the engine and by Mail; replies only dispatch dialogue_choice_selected.
- No Mail search surface (BBX-041/BBX-023), no withheld-fake state, no Evidence-Board affordance in BBX-040.

Consequences:

- BBX-040 ships an honest vertical slice; mailbox metadata beyond the schema remains deferred.
- E2E asserts user-visible discovery state derived from engine state, without data-/window-store/debug seams.
- Context consumers must receive a fresh session object per committed engine state (React context propagation); dispatch closures stay referentially stable (react-hooks/refs lint rule).

---

## ADR-022 — Records read-mode is search-first through the BBX-023 search index (BBX-041)

Status: Accepted (v2 supersedes v1)

Decision:

BBX-041 renders authored RecordDefinition content (docs/09 §6) through the BBX-023 searchable index, with no new Records schema. There is no browse list.

- The Records view is search-first: a blank query renders a search prompt, never a list of `unlockedRecords`. `unlockedRecords` is not consulted by the Records model at all.
- Search runs through the existing `searchContent` over `case.searchableIndex` record entries, gated by the same `toRuleEvaluationContext` the engine uses. BBX-023 availability rules are authoritative; record ordering follows authored tier/rank.
- `classified_placeholder` results keep their ranked position as generic sanitized rows (no title/type/source/date/metadata/body/evidence) and are never dereferenced into record data. `hidden` results never surface.
- Opening an available record emits `{ kind: "game_event", event: { type: "record_opened", entityId } }` through the engine. No `search_performed` or `evidence_discovered` events are emitted for read/search actions.
- Detail uses only schema fields: title, recordType, createdAt/revisedAt, source.system or source.organizationId (fallback "Unknown source"), evidenceId -> evidence.title but only while the evidence id is in `discoveredEntityIds`, relatedEntityIds resolved only against records (fallback: raw id), metadata as ordered key/value rows.
- The opaque rich-text body is never interpreted or rendered; canonical fixture content is untouched.
- Synthetic BBX-041 content (gated/classified records, index entries, bootstrap trigger) lives only in the test-only cloned bundle in `src/test/fixtures/records-content.ts`.
- Selection and search query are component state (non-persistent), mirroring Mail's read state.

Context:

docs/12 BBX-041 ("Search, detail, metadata"); docs/11 Session 7 requires fixture content, keyboard behavior, empty/error states, and tests. docs/09 §12 defines searchableIndex entries with availabilityRule gates; docs/09 §6 defines records but leaves rich text opaque.

Rationale:

- A single public projection (rule-context.ts) feeds both engine trigger evaluation and search gates, so unlock truth and availability truth cannot diverge (BBX-041 refactor of step-case-engine.ts).
- Search-first keeps results deterministic from authored index semantics; a browse list would privilege engine unlock order over authored availability.
- Classified placeholders must surface (they are searchable intel) without leaking metadata — sanitization happens before any record dereference.
- Emitting `record_opened` lets authored rules (e.g. evidence discoveryRule) key on records being read, per docs/08 §5 and the docs/09 example.

Consequences:

- Records availability is authored in the searchable index; authors must keep index availability rules aligned with unlock triggers.
- Global case search remains a later task.
- Records UI ships behind the existing app_records catalog entry (already registered); WindowContent routes it.

---

## ADR-023 — Messenger reuses the BBX-022 DialogueNode transport with a session-owned engine boundary (BBX-042)

Status: Accepted

Decision:

BBX-042 renders authored `DialogueNode` content (docs/09 §7) for the session's messenger channel as a single-thread, save-local conversation, mirroring ADR-021's Secure Mail architecture: the BBX-022 engine owns all dialogue progression, and `CaseEngineState.queuedDialogue` is the authoritative message queue.

- `messengerChannelId` is an optional, session-configured channel id on `CaseSessionConfig`. A configured channel projects queued dialogue nodes whose `channelId` matches; an undefined channel renders the honest "No messages" empty state — never a crash and never a fallback channel. Messenger is reachable from existing harnesses (e.g. the mail harness) that configure no messenger channel, which is why the undefined case is tested.
- Choice buttons are authored `DialogueChoice` entries. Their disabled state is derived solely from `state.selectedChoices.includes(choiceId)` — engine-authoritative, no local UI state. Because BBX-022 re-applies choice consequences on every `dialogue_choice_selected` input (`step-case-engine.ts`), re-clicking an authorable choice would duplicate `queue_dialogue` effects; the disabled button structurally prevents a second emission. Assertions cover the exact `[greeting, reply]` queue result.
- `dialogue_choice_selected` is the only `EngineInput` Messenger emits. No `evidence_discovered` events originate from Messenger; attachments remain presentation-only and are not rendered in this MVP; there is no read/unread state, no search, no persistence, and no synthetic content in production Case-001.
- **enterRule has no runtime owner.** `DialogueNode.enterRule` is reference-validated only by BBX-024 (`validate-bundle.ts`); BBX-022 (`stepCaseEngine`) never evaluates it, and Messenger does not assume ownership. Messenger therefore never reads `enterRule`; authored dialogue gating happens exclusively through authored triggers. Runtime ownership of `enterRule` is deferred to a future dialogue milestone and must not be silently redefined as trigger semantics.
- The augmented test bundle lives only in the cloned fixture `src/test/fixtures/messenger-content.ts`. `bundle_basic_valid.json` was previously modified by BBX-040 (`trigger_mail_test`); the BBX-042 requirement is **zero new modifications** to the canonical bundle.
- Ordering fact: choice consequences execute before trigger evaluation in BBX-022, so an authored follow-up chain (greeting -> reply through a choice consequence) yields the exact queue order regardless of trigger scheduling.
- `nextNodeId` remains unconsumed by Messenger and BBX-022 (see ADR-021); duplicate queued ids are preserved in order and keyed occurrence-safely in the UI.

Context:

docs/12 BBX-042 ("Messenger"): authored choices and triggers, P1. docs/10 and the Mail slice (ADR-021) established the session-owned engine boundary; the MessageTransport convention is the shared recollection of Mail's prose: the engine queues, consumers project. docs/11 requires fixture content, keyboard behavior, empty states, and tests.

Options considered:

- A dedicated messenger schema: rejected — Mail already proves DialogueNode transports cross-channel messages without schema changes (ADR-021 rationale).
- Local UI state for choice selection: rejected — it can diverge from engine truth and does not stop re-dispatch of a second input.

Rationale:

- Queue-order projection keeps delivery deterministic from engine state alone, matching the Mail model contract (`buildMailInbox`) and its duplicate/idempotency behavior.
- Engine-derived disabled state is the only guard that is true under non-React (direct engine) use.
- Optional channel id keeps the harness/session API honest: a session may simply have no messenger channel.

Consequences:

- Messenger ships behind the existing `app_messenger` catalog entry (already registered); `WindowContent` routes it.
- The messenger thread is ephemeral (component-projected from engine state); persistence/hydration is a later milestone.
- Authors gate messenger content with triggers; `enterRule` on dialogue nodes stays inert until a future owner milestone.

---

## ADR-024 — Notification content contract: NotificationDefinition collection with validator-proven references (BBX-043 prerequisite)

Status: Accepted

Decision:

Notification presentation content is owned by a new `NotificationDefinition` content collection. The engine is unchanged.

- `NotificationDefinition` (docs/09 §19) carries exactly `id`, `text`, `priority`. Nothing else: no title, sender, icon, timestamp, target/deep-link, read state, dismiss state, or sound — none are documented.
- `priority` is the verbatim docs/07 §14 taxonomy: `informational | discovery | message | urgent | system_anomaly`. BBX-043's roadmap acceptance ("Priority and history") requires this as an authored property; no derived scheme (id prefix, event type, trigger priority, source, UI mapping) is permitted.
- `ContentBundle.notifications` is `z.array(notificationDefinitionSchema).default([])`: existing bundles parse unchanged, the parsed runtime shape always exposes a deterministic array, and per-item validation stays strict.
- BBX-024 resolves `show_notification.notificationId` against the collection: unresolved ids fail with `reference_unresolved`, wrong-kind references fail with `reference_wrong_kind`, and duplicate notification ids are covered by the existing global readable-ID uniqueness registry (`duplicate_id`).
- `stepCaseEngine` is not modified: it still appends the opaque `notificationId` to `CaseEngineState.notifications` (append-only, duplicates allowed, engine order preserved). Static validation owns authored reference correctness.
- Notification Center UI, read/unread, dismissal, deep-links, and toast behavior remain deferred to BBX-043 and later milestones; this ADR decides the content contract only.

Context:

docs/12 BBX-043 acceptance is "Priority and history". The engine already owned `CaseEngineState.notifications` and the `show_notification` effect, but no content collection existed to define authored presentation content or priority (previously recorded as deferred in ADR-013/ADR-015). Without this contract, BBX-043 could not honestly implement the priority requirement.

Options considered:

- Engine-added priority/existence checks: rejected — per the ADR-023 engine-ownership precedent, the engine does not absorb content ownership; static validation proves authors correct before runtime.
- Required `notifications` key on all bundles: rejected — it would force unrelated canonical-fixture churn with no correctness gain.
- Optional `notifications?` key: rejected — consumers would see `undefined` and the array would no longer be deterministic.

Consequences:

- The fixture `bundle_basic_valid.json` is unchanged; new notification content is exercised by the dedicated valid bundle fixture `bundle_notifications_valid.json` and code-level cloned fixtures.
- BBX-043 UI may now project `state.notifications` -> NotificationDefinition lookup -> text + priority, with occurrence-preserving order, without new runtime semantics.
- `Application` remains the only effect-target collection still deferred for runtime/validator reference purposes.

---

## ADR-025 — Evidence Board pure domain contract (BBX-050A1)

Status: Accepted

Decision:

- `CaseEngineState.discoveredEntityIds` remains the sole authority for evidence discovery and progression. `EvidenceBoardState` owns only player board edits: evidence-node positions, plain-text private notes, and neutral player-hypothesis links.
- Evidence node identity is derived as `evidence:<evidenceId>`; authored evidence metadata remains in `ContentBundle` and is never duplicated in board state.
- `EvidenceBoardSnapshotV1` is a strict, JSON-safe, board-local contract with its own literal version. Board-runtime note and edge IDs begin at sequence zero (`note_0` / `edge_0`) and use canonical lowercase base-36 suffixes; they are not authored content IDs.
- Notes trim outer whitespace, preserve internal whitespace, require explicit deletion, and never delete or clear a note through a blank edit.
- BBX-050 links are neutral player hypotheses. Their endpoint pairs are canonical lexical order, unique, and unverified; BBX-051 alone introduces verified authored relationships.
- Board reconciliation is one-way from authoritative discovered evidence. Structurally invalid snapshots fail parsing; structurally valid but stale evidence nodes and their incident edges are removed during reconciliation.
- The domain contract has no React Flow dependency.

Consequences:

- SaveGame integration, runtime hydration, autosave, IndexedDB, viewport persistence, and reset are explicitly deferred to a separately reviewed persistence slice. BBX-050 is incomplete until that slice proves save and restore.
- Fallback placement remains deterministic implementation detail in the pure domain module, not an authored or persistence contract.

---

## ADR-026 — Evidence Board workspace-runtime ownership (BBX-050B)

Status: Accepted

Decision:

- BBX-050B owns committed `EvidenceBoardState` at workspace-runtime scope. It survives Evidence Board window close/reopen while the workspace remains mounted, and multiple Evidence Board windows share the same committed board state.
- `CaseSession` and `CaseEngineState` remain the sole authority for discovery and progression. React Flow node state is transient presentation and interaction state; A1 state remains authoritative for committed board edits.
- Reloading the page resets BBX-050B board edits. Durable save and restore remain deferred to A3.

---

## ADR-027 — SaveGame V2 runtime hydration and durable board persistence (BBX-050A3b)

**Status:** Accepted

**Decision:** Add an application-level `SessionSaveRuntime` that loads a trusted `SaveGameV2` through the existing `SaveRepository` before mounting interactive session providers. It passes the restored `CaseEngineState` to `CaseSessionProvider`, hydrates the saved `EvidenceBoardSnapshotV1` through A1, reconciles discovered evidence with `syncDiscoveredEvidence`, and activates autosave only after hydration is ready. The runtime owns repository/database lifecycle, persistence status, latest-state references, and the discovery-to-board reconciliation barrier; the session and board providers remain storage-agnostic authorities.

**Consequences:**

- SaveGame V2 remains the single durable transaction containing engine and canonical board state.
- Desktop/window layout persistence remains a separate localStorage-backed presentation concern, outside SaveGame V2, EvidenceBoardSnapshotV1, and the SessionSaveRuntime IndexedDB transaction. React Flow viewport and selection remain transient and unpersisted.
- Runtime identity gates require matching slot, case, and content version; incompatible saves fail closed without overwriting storage.
- Autosave composes from the latest engine, board, game-event, UI-snapshot, and settings references at write-start. Only committed A1 board mutations request `evidence_board_edit`; React Flow transient state, viewport, and selection remain excluded.
- Engine discovery requests wait for the matching board reconciliation callback, so a persisted save cannot contain new discovery with a stale board.
- Existing coordinator single-flight, debounce, retry, and flush semantics remain unchanged. Persistence status observes actual repository writes through a decorated repository.
- Runtime-owned write serialization and generation-aware flush-to-quiescence drain current and retired coordinator work before disposal and database close. `pagehide` flushing is best effort only; durability is claimed only after `repository.save()` resolves before unload.
- The guarded evidence-board route proves browser reload through real IndexedDB. Production `/game` remains without a session bootstrap, so BBX-050 remains partial.

---



## ADR-028 — M3 production entry: /game bootstrap, single-slot identity, and Objective Tracker (BBX-050 completion + BBX-060)

**Status:** Accepted

**Decision:** Production `/game` mounts `SessionSaveRuntime` directly with the validated production Case 001 bundle as content, the authored bootstrap initial state, and a deterministic single local save slot (`slot_case_001`). The production bootstrap is a thin composition seam only: it selects the case content, the initial engine state, the slot identity, channel ids, and application/content version metadata. It owns no gameplay mutation logic.

**Context:** BBX-050 required production `/game` to run through the real persistence/runtime stack, not the guarded test harness. BBX-060 required an objective tracker that is a data-driven projection only. No save-slot UI, profiles, cloud save, or login existed, and none were needed for the vertical slice.

**Options considered:**

- Multiple save slots / a slot-selection UI (rejected: no product contract exists yet; a single deterministic slot is the smallest honest policy for the vertical slice, documented until a future BBX slot-management milestone).
- A second objective state store (rejected: every other authority holds exactly one store; the tracker must not decide progression).
- Loading Case 001 from a JSON fixture file under `src/content/fixtures/` (rejected: production content must not depend on test fixtures; production content lives under `src/content/cases/case_001_missing_signal/` and is parsed/validated through the same real Zod + BBX-024 boundary used by validators and tests).

**Rationale:**

- `SessionSaveRuntime` keeps trusted load, identity gates, hydration, autosave, flush, and disposal as the single persistence authority; `/game` duplicates none of it.
- Slot/case/content-version gates require a stable produced slot constant and content version; `slot_case_001` and `case.version` ("1.0.0") satisfy them deterministically.
- Objectives are projected by the pure `projectObjectives` function from `CaseManifest.objectives` plus `CaseEngineState.activeObjectives`/`completedObjectives`; objective lifecycle remains engine-owned via authored `start_objective`/`complete_objective` trigger effects. `ObjectiveDefinition.completionRule` remains authored documentation (like `DialogueNode.enterRule`); the runtime completion path is a once-trigger whose rule requires both contradiction evidence items to be discovered.
- The Taskbar shows the active case title from the session via `useOptionalCaseSession` (fallback "Case: none"), giving the production E2E a stable semantic case-status signal.

**Consequences:**

- BBX-050 is DONE: production persistence acceptance passes (production E2E `e2e/case-001.spec.ts` proves evidence discovery, objective progression, a canonical board note, and their restoration across real IndexedDB reload).
- BBX-060 is DONE: projection + read-only Objectives app + focused tests; progression implementation stays data-driven.
- BBX-100 remains PARTIAL: Stage 1 minimum production slice only; later stages, Signal Analyzer, and full content remain.
- The single-slot policy is a documented temporary constraint; future slot management is a separate milestone and must preserve SaveGame V2 compatibility.

---

## ADR-029 — Case 001 Stage 2 + BBX-070 Signal Analyzer: authored puzzle truth, unlock-gated app, generic engine integration

**Status:** Accepted

**Decision:** BBX-070 is implemented as a production desktop app (`app_signal_analyzer`) whose puzzle truth is authored content: a `signal_comparison` puzzle kind in a new `puzzles` ContentBundle collection (schema + validator, `default([])` backward-compatible), with per-property authored reference/disputed values and a `decisive` flag set. A pure domain evaluator (`src/domain/signal-analyzer`) decides correctness: a submission is correct only when the player's marked discrepancy set exactly equals the authored decisive set. Correct submission dispatches the generic `game_event {type:"puzzle_completed", entityId}` input; authored triggers then discover the solution evidence, complete the Stage 2 objective, and set a flag. Incorrect submissions dispatch nothing, show generic feedback, and allow retry. The app is hidden from the Launcher until `CaseEngineState.unlockedApplications` contains `app_signal_analyzer` (new generic `ApplicationDescriptor.requiresUnlock` flag; Launcher projects availability from session state).

**Context:** BBX-070 required a visual/tabular signal comparison with authored truth and no hardcoded answers. docs/05 Stage 2 specifies the ferry authenticity puzzle (4 properties × normal/disputed, decisive indicators: gate device + account signature; conclusion: administrative replay injection). No puzzle schema existed; `unlockedApplications` was tracked and persisted but never consumed; BBX-071 (generic Puzzle Adapter API) was not part of this slice.

**Options considered:**

- Hardcoding the correct-answer set in React or the domain (rejected: violates the authored-truth invariant; puzzle truth belongs in content).
- Reusing record metadata for comparison data (rejected: metadata is flat scalars; cannot hold the property list cleanly; validator could not resolve references).
- A separate puzzle-progress store or adapter contract (rejected: BBX-071 stays unimplemented; the existing generic engine input/trigger/effect architecture fully satisfies the flow).

**Rationale:**

- The `puzzles` collection follows the `notifications` precedent (default `[]`, validator registration, reference resolution) — the smallest honest schema addition.
- The evaluator is total, deterministic, and reads only authored data; `decisive` is never rendered, so the answer is not revealed before completion.
- Engine integration reuses existing machinery: `unlock_application`/`start_objective` on the authored activation trigger, `discover_evidence`/`complete_objective`/`set_flag` on the authored completion trigger. No runtime/engine changes were required.
- Launcher gating is generic (any future app can set `requiresUnlock`); existing always-available apps are unaffected; the analyzer also renders a locked state as defense-in-depth against ungated window restoration.
- Persistence requires no SaveGame V2 change: all progression lives in `CaseEngineState` (unlockedApplications, discoveredEntityIds, completedObjectives, flags, eventHistory). The analyzer's selection/result is transient component state. The pre-existing unused `"puzzle_completed"` AutosaveReason member stays unused in production because the trigger effects already autosave through `evidence_discovered`/`objective_completed` paths.

**Consequences:**

- BBX-070 is DONE: authored puzzle, pure evaluator, unlock-gated production app, incorrect/retry semantics, production Stage 1 → Stage 2 E2E with reload restore (e2e/case-001-stage-2.spec.ts).
- BBX-100 remains PARTIAL (Stage 1 + Stage 2 slices; Stage 3+ deferred).
- BBX-071 remains unimplemented; a future adapter may generalize puzzle results if more kinds arrive, but none is required today.
- `puzzles` is a validated content collection; future puzzle kinds extend the discriminated union and must add validator coverage.

---

## ADR-030 — Case 001 midgame: Stage 3 branch flags, Stage 4 evidence set, and durable Hint Ladder (BBX-061)

**Status:** Accepted

**Decision:** Stage 3 (Sera's damaged-tablet decision) is authored as a Messenger dialogue node with three choices; each choice sets exactly one boolean branch flag (`tablet_path_ciab` / `tablet_path_offline` / `tablet_path_pelaga`) via its consequences. Messenger enforces node-level choice exclusivity: once any choice of a node is in `selectedChoices`, all sibling choices are disabled (`choicesResolved` derived in the pure messenger projection from engine state — no local component state, per ADR-023). Stage 4 activates on any branch via one authored trigger (`any([choiceSelected c1..c3])`), and its completion requires exactly three branch-independent evidence items (`ev_001_node7_summary`, `ev_001_manual_escalation`, `ev_001_corridor_access`) — so no Stage 3 choice can create a dead end. The optional `ev_001_diagnostic_note` (Option 2 only) and the optional/meta `ev_001_isolation_event` never gate completion. BBX-061 is implemented as a durable four-tier hint ladder: `CaseEngineState.revealedHintIds` (new `hint_revealed` EngineInput, added via `z.array(z.string()).default([])` to the strict `caseEngineStateSchema` — backward compatible, no V3/migration), a new `"hint_revealed"` AutosaveReason + `onEngineCommit` branch, a pure `src/domain/hints` ladder projection (tier labels Refocus/Direction/Connection/Answer path per docs/03 §5.9), and a player-requested Hint button + reviewable history in the Objectives app (no second store, no auto-reveal, no localStorage).

**Context:** docs/05 specifies the Stage 3 choices and consequences and Stage 4 facts, but does NOT identify which data Option 1 redacts, which optional record Option 3 removes, or Reno's exact response content. docs/13's branch matrix (CIAB redacted-solvable, offline diagnostic-note unlocks, Pelaga optional-record-removed) verifies outcomes only. docs/12 BBX-061 requires "Four tiers and history"; docs/07 §16 requires hint button near the objective, no penalty, strength shown before reveal, and reviewable previous hints. The strict SaveGame V2 schema (zero defaults) meant a naive `revealedHintIds` field would break loading of every existing save.

**Options considered:**

- Fabricating the unspecified redaction/record/Reno content (rejected: violates the source-gap policy; the delivery must not invent narrative facts absent from docs).
- Engine-level "one choice per node" enforcement (rejected: contradicts the documented engine pipeline and ADR-023's re-apply fact; the projection-level sibling-disable satisfies the acceptance deterministically).
- A separate hint store, localStorage hint state, or app_hints application (rejected: engine-state ownership + Objectives-app placement per docs/07 "Hint button near objective").
- Requiring `ev_001_diagnostic_note` for Stage 4 completion (rejected: it is Option-2-only, which would dead-end Options 1 and 3 — docs/05: "No choice prevents completion").
- A SaveGame V3 bump for hint history (rejected: `.default([])` on the strict schema is backward compatible and needs no migration).

**Rationale:**

- Boolean branch flags are the smallest honest representation of the documented
  consequences; ADR-008 forbids numeric trust meters but not authored booleans.
  `sera_trust_increased` records the documented Option-2 consequence (docs/05:
  "increases Sera's trust"); it is permitted but currently unread by any rule —
  a progression seed reserved for future dialogue/ending content, so its
  'consumption' claim is not made.
- The three-evidence Stage 4 completion set honestly proves the documented answer ("collecting a local diagnostic archive because remote records were being suppressed"): Node 7 summary shows the suppression, the escalation ticket is the motive (docs/13 "Review manual escalation | objective advances"), and the corridor access log places Maya in the corridor. The isolation event stays optional/meta.
- Hint reveal is a recorded player event with no progression effects: `toRuleEvaluationContext` never exposes `revealedHintIds`, so no authored rule can gate on it; durability comes from engine state inside SaveGame V2, autosaved via the new reason branch.

**Consequences:**

- BBX-061 is DONE: four tiers, progressive reveal, durable history, reload proof (e2e/case-001-midgame.spec.ts).
- BBX-100 remains PARTIAL (Stage 1+2+3+4 slices; Stage 5+, conclusion, endings deferred).
- The three source gaps are documented, not fabricated; future content work may name the specific redaction/record/Reno content when authored.
- The sibling-disable guarantee holds at the projection/UI layer; a direct programmatic dispatch of a sibling choice would still re-apply consequences (engine contract unchanged) — noted for future dialogue work.

---

## ADR-031 — Case 001 endgame: conclusion report, outcome evaluator, and pre-report checkpoint (BBX-080/081/082)

**Status:** Accepted

**Decision:** BBX-080 ships the production Conclusion Report desktop app (`app_conclusion`) as a thin presentation layer over two pure domain contracts. BBX-081 owns deterministic outcome selection and canonical report preparation. BBX-082 owns a pre-submission checkpoint with in-memory retry restore. The submission event pipeline is `checkpoint_requested → report_submitted → outcome_selected`, each step driven through the existing BBX-022 engine input path.

- **Report draft domain (`src/domain/outcomes/report-draft.ts`):** typed `ReportDraft` (claimAnswers by claim-slot id, evidenceIds, disclosureChoiceId) with pure selectors; no UI or engine coupling.
- **Submission domain (`src/domain/outcomes/report-submission.ts`):** `validateReportDraft` checks every non-optional claim answer exists and is a valid option id, evidence count ≥ `evidenceSlotCount`, no duplicate evidence ids, every evidence id resolves in `content.evidence`, and the disclosure choice resolves. `prepareSubmission` is total and deterministic: on valid drafts it always emits one `claim_<slotId>_correct` flag per answered claim, plus `disclosure_recipient` and `disclosure_redacts` — the engine applies these as `set_flag` effects during the `report_submitted` step.
- **Outcome evaluator (`src/domain/outcomes/evaluate-outcomes.ts`):** `selectOutcome(outcomes, state)` evaluates each `evaluationRule` via the shared BBX-021 `evaluateRule`/`toRuleEvaluationContext`, keeps matches, sorts by **priority descending** with **declaration-order tie-break**, and returns the winner (`{kind:"none"}` only when nothing matches). Case 001 authored priorities: placeholder stage-1 = 1, A protected_truth = 40, B official_compliance = 30, C public_exposure = 20, D misidentified = 10. Because `prepareSubmission` always emits all four claim flags (true or false), every valid report matches ≥1 outcome — the evaluator contract guarantees no dead end.
- **Pre-report checkpoint (BBX-082):** `SessionSaveRuntime.captureCheckpoint` stores an immutable `SessionSaveSnapshotV1` (engine state + board) as `sessionSnapshot.checkpoint` when a `checkpoint_requested` commit is seen; once captured it is preserved across all later autosaves. `restoreCheckpoint` returns a remount seed that strips `submittedReport`/`selectedOutcomeId`/`caseCompleted`. Retry dispatches `checkpoint_restore_requested`; the runtime bumps `sessionEpoch` to remount the session providers from the checkpoint seed (a state swap, not a page reload). A checkpoint-less restore is a defensive no-op.

**Context:** docs/12 assigned BBX-080 (claims, evidence, disclosure), BBX-081 (all endings deterministic), and BBX-082 (safe retry) on the critical path. docs/09 §13 documents outcome priority but not the direction or tie-break; docs/05 Stage 6 defines 4 claim slots, 3+ supporting evidence, and 4 disclosure choices. docs/03 §5.10 requires the player to review the outcome and restart from the pre-report checkpoint. `CaseEngineState` previously had no notion of a submitted report, a selected outcome, or a completed case.

**Options considered:**

- A dedicated report/ending state store (rejected: every other authority holds exactly one store; the conclusion must not decide progression).
- Storing the checkpoint outside the SaveGame envelope (rejected: the checkpoint must survive reloads, so it belongs in the same trusted V2 transaction).
- A SaveGame V3 bump for the new engine fields (rejected: `.default(...)` on the strict schema is backward compatible with existing V2 snapshots and needs no migration; V1→V2 migration already exists and is untouched).
- Gating Ending A on `disclosure_redacts = true` (rejected — see the Ending A decision below).

**Rationale:**

- Reusing `evaluateRule`/`toRuleEvaluationContext` keeps the BBX-021 rule context authoritative for outcomes, matching the precedent set by search gates (ADR-016) and Record availability (ADR-022).
- Emitting correctness flags from `prepareSubmission` keeps authored outcome rules simple and total: `not(flagEquals ... true)` reliably means "wrong" because the flag is always present after a valid submission.
- Priority descending matches the only documented priority direction (docs/09 §13 "highest priority wins", ADR-015); declaration-order ties match engine trigger tie-break semantics.
- The checkpoint is captured from committed engine state at submission start, so the restored session is exactly what the player saw before submitting — not the live draft form state.

**Consequences:**

- BBX-080, BBX-081, and BBX-082 are DONE; the full Case 001 Stage 1→6 loop including report submission, deterministic ending, and retry is implemented and proven by unit tests, component tests, and production E2E.
- `CaseEngineState` now includes `submittedReport` (nullable record), `selectedOutcomeId` (nullable string), and `caseCompleted` (boolean), all with `.default(...)` for backward-compatible SaveGame V2 parsing.
- The checkpoint uses a self-referential lazy schema (`z.lazy`) with `checkpoint` optional/nullable, so legacy V2 snapshots without a checkpoint parse cleanly.
- Ending A's authored rule intentionally does not require `disclosure_redacts=true` (see ADR-032); `redactsLocation` remains authored data used by UI presentation.
- Later content collections added by future ending/report work must each add their own BBX-024 reference checks (per ADR-013).

---

## ADR-032 — Ending A rule omits `disclosure_redacts` to guarantee every valid report lands

**Status:** Accepted

**Decision:** `outcome_001_protected_truth`'s `evaluationRule` requires all four claim flags correct AND `disclosure_recipient = "mio"`, and does **not** require `disclosure_redacts = true`. `disclosure_redacts` remains authored data (emitted by `prepareSubmission`, used by UI presentation) but is deliberately absent from the outcome rule.

**Context:** docs/05 §5 lists "Redact Maya's location" among Ending A conditions. The implementation intentionally diverges from that narrative ideal: a fully-correct report submitted to MIO **without** the redaction option (disclosure_001_mio_full) would otherwise match NO ending — A requires redact, B requires forwarded/pelaga, C requires leak, D requires a wrong claim. That is an unhandled dead end for a valid, well-evidenced submission. Ending A's priority (40) already sits above B/C/D, so all-four-correct + MIO resolves unambiguously to A even before redaction is considered.

**Rationale:**

- The deterministic guarantee that "every valid submission lands" (documented in ADR-031 and enforced by the evaluator contract) takes precedence over the narrative condition; a report that is factually correct and discloses to the integrity office is authored to represent the Protected Truth path regardless of redaction granularity.
- Keeping `redactsLocation` in the data model preserves the authored distinction for UI presentation (and for future content that may read it) without making the rule fragile.
- The docs/05 condition remains the narrative ideal; this ADR records the rule-level decision so the divergence is deliberate and reviewable, not a silent drift.

**Consequences:**

- A valid report can never produce `{kind:"none"}`; all four ending families are reachable and deterministic (proven by `case-001-content.test.ts` parameterized reachability and `evaluate-outcomes.test.ts`).
- Ending A is achievable via both MIO-full and MIO-redacted disclosure; players are never punished for choosing the non-redacting MIO submission.
- Future content authors must understand that `disclosure_redacts` is presentation data unless a rule explicitly reads it.

---

## ADR-033 — Hidden BLACKBOX meta flag gates on `outcome_selected`

**Status:** Accepted

**Decision:** `trigger_006_meta_flag` (once, priority 5) fires only when all three of: `ev_001_isolation_event` discovered, `masked_forwarded` NOT true, and an `outcome_selected` event has occurred. Its effects set `noticed_blackbox_intervention = true` and show `notification_001_blackbox_meta` ("ANALYST MODEL: RESISTS RECOMMENDED CLOSURE"), which is tied to the hidden meta ending `ending_001_blackbox_meta` (`isHiddenMeta: true`). The meta flag is a hidden epilogue, not a fifth primary ending.

**Context:** docs/05 §5 specifies the meta flag fires when the player discovers `bbx_risk_orchestrator` and does not forward the masked contact. Without the `outcome_selected` gate, the trigger would fire during Stage 4 for every isolation-event discoverer — before the Stage 5 forward decision is settled.

**Rationale:**

- Gating on `outcome_selected` (an event the engine appends only after report submission) makes the flag evaluate the Stage 5 decision in its final, committed state, per the "choice consequences execute before trigger evaluation" ordering fact (ADR-015).
- `not`/`flagEquals` on `masked_forwarded` encodes the docs' "does not forward" condition deterministically via the authored Stage 5 choice consequence.
- Keeping it a single hidden flag + notification (rather than a fifth outcome) preserves the documented four-ending taxonomy while still rewarding the meta discovery.

**Consequences:**

- The meta flag is reachable and tested (unit reachability + E2E harness), and remains optional — it never gates completion or any primary ending.
- A player who forwards the masked contact or never discovers the isolation event simply never sees the meta epilogue; no dead end is introduced.

---

## ADR-034 — Localization foundation: en/id locales, compile-checked dictionaries, and presentation-only case overlays

**Status:** Accepted

**Decision:** The game UI is bilingual (English and Bahasa Indonesia). `en` is the default locale and the single source of truth for all authored strings; `id` is the only additional supported locale.

- **Locale resolution and persistence.** The initial locale prefers the persisted preference (localStorage `bbx.locale`), then the browser languages (first `id*` match in `navigator.languages`), then the default. Storage access is guarded so SSR and privacy modes never throw; the provider mirrors the active locale to `document.documentElement.lang` and `data-locale`.
- **Dictionaries with compile-enforced parity.** Both dictionaries are typed `Record<TranslationKey, string>` with `en.ts` as the source of truth (~236 keys); a missing entry is a compile error, and the runtime fallback returns the key itself as a dev-visible guard. `{placeholder}` interpolation never throws.
- **Case content as presentation-only overlays.** Each case ships `i18n/index.ts` exporting `caseOverlays` keyed by canonical entity ids and carrying only presentation fields (titles, text, labels, prompts). `resolveLocalizedBundle` returns the canonical bundle unchanged (same reference) for `en` and a new overlaid bundle otherwise. Ids, rules, effects, priorities, and flags are never overlaid and the input bundle is never mutated, so progression and saves stay locale-independent. Localized search `exactTerms`/`aliases` are APPENDED after the canonical English terms, keeping authored search deterministic and additive.
- **Resolution at the React consumption boundary.** `CaseSessionProvider` resolves the overlay in a `useMemo` keyed on content and locale; `config.content` remains the canonical English bundle for persistence and engine truth, and a ref mirror keeps the stable dispatch closures stepping against the current locale's bundle.
- **Chrome localization.** `APP_CATALOG` entries carry a `titleKey` consumed through `useT()`; pure label helpers (`src/lib/locale/domain-labels.ts`, `content-labels.ts`) keep domain-facing labels React-free, and unknown content enum values fall back to the raw value.
- **Overlay validator.** `pnpm validate:i18n` cross-checks every case overlay against the canonical en bundle: unsupported locales, unknown ids, missing entries or required presentation fields, and blank strings fail with exit code 1.
- **Live switching.** The Settings app switches locale at runtime without a reload. The evidence-board provider keys case identity on `caseId` only, so a same-case content-reference change (a locale switch) reconciles instead of resetting and preserves player positions, notes, and edges.

**Context:** docs/02 lists "Localization pipeline" as a post-vertical-slice candidate; this ADR records its early delivery as a presentation-only layer with zero engine, rule, or save changes. No backlog item previously tracked the work.

**Options considered:**

- Runtime or machine-generated translation (rejected: all content must be authored and deterministic; runtime generative AI is prohibited).
- Fully duplicated per-locale content bundles (rejected: doubles the authoring and validation surface and risks progression drift; overlays keep ids and rules single-sourced).
- Applying overlays at content load or persistence time (rejected: persisted saves must remain canonical English and locale-independent).
- Locale state in the zustand UI store (rejected: React context is sufficient; no window/layout interaction requires shared store state).

**Rationale:**

- Compile-enforced dictionary parity plus the overlay validator extend the project's validated-content discipline (BBX-020/BBX-024) to localization: missing translations fail the build, not the player.
- Resolving at the consumption boundary keeps the engine, rules, search semantics (ADR-016), and SaveGame V2 untouched; canonical English stays the persisted value.
- Pure label helpers preserve the architecture boundary that domain modules must not import React.

**Consequences:**

- Saves, engine state, and progression are fully locale-independent; no SaveGame schema change was required.
- New cases must ship an `i18n/index.ts` overlay and register an en-bundle loader in `scripts/validate-i18n.ts`.
- Known remaining gaps are tracked as backlog follow-ups (BBX-131 through BBX-135): mail/messenger fallback labels, evidence-board adapter strings, persistence sr-only text, `case.title` overlay support, and CI wiring.
- docs/02's post-vertical-slice "Localization pipeline" entry is now partially delivered ahead of schedule; the PRD text remains unreconciled.

---

## ADR-035 — Interactive analyst workspace + Case 001 Stage 0 onboarding

**Status:** Accepted

**Decision:** The `/game` desktop now opens into an interactive analyst workspace with a production Stage 0 onboarding for Case 001. Stage 0 ships the ids `obj_000_analyst_verification`, `trigger_000_bootstrap` / `trigger_000_credential_inspected` / `trigger_000_confirmation_complete`, `dialogue_000_*`, `choice_000_confirm_identity`, `ev_000_analyst_credential` (plus asset + record), and `notification_000_briefing`. A fresh bootstrap fires `case_000_bootstrap`; content version stays `"1.0.0"` (no SaveGame V3, no CaseEngineState change). `trigger_001_bootstrap` rule changed → `objectiveCompleted obj_000_analyst_verification`, fires once after Stage 0, preserving legacy saves.

App gating: `requiresUnlock` on mail, messenger, records, evidence_board, and objectives. `app_help` is added and always available. `app_settings` and `app_system_log` are always available. Boot is a presentation-only overlay (2.6s), skippable, tracked via localStorage `"bbx.bootViewed"` and never enters engine state. `WorkspaceHome` is a pure `projectWorkspaceHome` projection when `openWindows.length === 0`; `recommendedAppId` is optional objective metadata. No second store. Help app (`app_help`) has 6 localized sections. Motion reuses existing CSS tokens plus a global `prefers-reduced-motion` override.

**Context:** The desktop shell existed with the launcher/taskbar shell polish (BBX-110 slice 1). Stage 0 onboarding, an empty-workspace landing, and a boot treatment remained unshipped.

**Options considered:**

- New store for WorkspaceHome notebook state (rejected: WorkspaceHome is a pure projection, no notebook state).
- Boot overlay state persisted in engine state (rejected: presentation-only, never enters engine state).
- Boot sequence without skip (rejected: violates UX anti-pattern "long unskippable boot sequences").

**Rationale:**

- Reusing the existing event/objective/trigger/notification content schema avoids new domain types and keeps progression deterministic.
- WorkspaceHome as a projection avoids any second store and keeps state separation intact.
- Boot skippable and persistence-free respects save compatibility and reduced-motion rules.

**Consequences:**

- App gating on Stage 0 pre-mail apps requires unlock; Help/Settings/System Log remain always available.
- Added `pnpm validate:assets` + registry entry for the credential SVG.

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
