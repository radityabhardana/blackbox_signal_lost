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

## ADR-019 — Save migration blocked pending real schema transition (BBX-032)

**Status:** Accepted — Documented Blocked

**Decision:** BBX-032 (Save migration) is BLOCKED. `SAVE_SCHEMA_VERSION = 1` is the only real SaveGame schema version; no v0, legacy-v1, or v2 format exists in the repository, docs, fixtures, or tests. No fake historical format may be invented to satisfy migration tests. Migration is keyed only by `saveSchemaVersion`; `contentVersion` and `applicationVersion` are preserved metadata, never migration keys. There is no v1→v1 identity migration step; real migration steps correspond only to actual transitions (e.g., 1→2, 2→3). `save-codec.ts` is unchanged today.

**Context:** docs/12 assigns BBX-032 "P1 | Tests across schema versions". docs/13 §6 states: "Never ship a migration without fixtures from the previous supported version." BBX-030's validator (`verifyStoredSnapshot`) rejects non-v1 snapshots at `src/infrastructure/persistence/save-codec.ts:159-169` before selection — a v-old payload cannot currently reach a migration hook.

**Rationale (documented future behavior):**

- **Future candidate read pipeline** (per snapshot): checksum verification → `JSON.parse` into unknown → minimally extract/validate `saveSchemaVersion` → if current version: no migration → if older with a complete registered path: validate against that version's own historical schema, then migrate sequentially through real steps → validate the final output with the **current** `saveGameSchema` → return trusted current SaveGame. An old save must NOT be required to pass the current SaveGame schema before migration.
- **Previous-known-good with future migration:** candidates are tried in order `current`, then `previous`, and each runs the full pipeline independently (checksum → parse-unknown → version discovery → supported migration → current-schema validation). A candidate becomes usable only when that entire chain passes.
- **Version taxonomy:** `CURRENT` (`version === SAVE_SCHEMA_VERSION`) → no migration; `OLDER` with a complete real path → sequential migration; `OLDER` without a path → `unsupported_version`; `FUTURE` > current → `unsupported_version`; missing/malformed discriminator → `corrupt`. Version 0 is syntactically possible but not a historical format and stays unsupported unless a real v0 contract ever exists.
- **Migration step model (conceptual only, not code):** `SaveMigrationStep<From, To> { fromVersion; toVersion; migrate(payload: From): To }`. Zero real migration steps exist today.

**Unblock condition:** BBX-032 becomes implementable only when ALL of these hold: (1) a new real SaveGame schema version is introduced; (2) `SAVE_SCHEMA_VERSION` is bumped accordingly; (3) the previous supported schema shape is frozen/documented as a contract; (4) real previous-version fixtures exist; (5) a field-level migration specification exists (added/removed/renamed/reshaped fields, defaults, preservation rules).

---

## ADR-020 — Non-sensitive debug export (BBX-033)

**Status:** Accepted

**Decision:** BBX-033 provides a pure domain debug report containing exactly the six documented diagnostic categories from docs/08 §13: application version, save schema version, content version, recent domain event-type codes, browser capability summary (`indexedDB` + `serviceWorker`, fixed fields, never an arbitrary map), and error codes. `saveSchemaVersion` is imported from `SAVE_SCHEMA_VERSION`; `contentVersion`/`applicationVersion` are preserved exactly as supplied by the caller; events are caller-supplied type-code strings filtered to the shape `^[a-z0-9_-]{1,64}$`, in chronological order, duplicates kept, last 16 valid entries retained. `errorCodes` is typed `SaveRepositoryErrorCode[]` reused directly. There is no raw-error ingestion, no payload data, no timestamp, no UI/download, no analytics, no persistence access.

**Context:** docs/12 BBX-033 ("Non-sensitive diagnostics"); docs/08 §12 logs "a non-sensitive diagnostic code" only; docs/08 §13 lists the six exportable data points; docs/15 requires guest mode to store only local data with no unnecessary personal data and no analytics by default. BBX-032 is blocked (no migration), so no migration status is exported.

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
- Download/share UI remains a later integration task; BBX-032 stays blocked and completely decoupled.

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
