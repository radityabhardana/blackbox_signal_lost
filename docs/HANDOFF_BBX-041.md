# Session Handoff — BBX-041 Records

**Task:** BBX-041 — Records vertical slice (P1): search-first Records window, read detail with metadata and related entities, BBX-023-authoritative availability including classified placeholders, and `record_opened` progression events.

## Content model

- **No new Records schema.** Records = existing `RecordDefinition` (docs/09 §6) rendered through the BBX-023 searchable index.
- **Body contract:** the opaque `RichTextDocument` is **never interpreted or rendered**. Detail omits the body entirely; no body extractor exists.
- **Source label** = `source.system`, else `source.organizationId`, else "Unknown source".
- **Related labels** = `relatedEntityIds` resolved **only against records** (title), raw id fallback.
- **Evidence link** = `evidenceId -> evidence.title`, but only while `evidenceId ∈ state.discoveredEntityIds`; hidden before discovery (label only; no viewer).

## Search + availability (authoritative: BBX-023)

- **Search-first:** a blank query renders the search prompt (`{ kind: "search-prompt" }`); there is no browse list. `unlockedRecords` is never consulted by the Records model.
- Search runs through the existing `searchContent` over `case.searchableIndex` record entries, gated by `toRuleEvaluationContext(state)` — the **same projection the engine's trigger step uses**. Ordering follows authored tier/rank; results are filtered to `entityType === "record"`.
- `classified_placeholder` results keep their ranked position as generic sanitized rows (title/type/date null, inert, no authored text) and are **never dereferenced** into record data. `hidden` results never surface.
- Detail is offered only for a record whose current ranked result is `available: true`. Opening an available record dispatches `{ kind: "game_event", event: { type: "record_opened", entityId } }`. Search/open emit no `search_performed` and no `evidence_discovered`.

## Engine refactor (context consistency)

- New `src/domain/engine/rule-context.ts`: single public `toRuleEvaluationContext(CaseEngineState)` projection; `step-case-engine.ts` delegates its former private `buildRuleContext` to it. Exported from `src/domain/engine/index.ts`. Behavior-preserving (existing engine tests unchanged and green).

## Fixtures

- `bundle_basic_valid.json` is **unchanged** (HEAD). BBX-041 content never touches the canonical fixture.
- `src/test/fixtures/records-content.ts`: test-harness-only — static JSON import (Next bundler `__dirname` fix, same as mail), clones the canonical bundle and augments it with synthetic records + index entries + bootstrap trigger, re-validated through `contentBundleSchema`:
  - `record_second` ("Ferry transfer log", source `org_ferry_services`) — index availability gated on `eventOccurred record_opened`.
  - `record_classified_test` ("Reactor core inspection") — `unavailableBehavior: "classified_placeholder"`, gated on `records_release_authorized` (never fires).
  - `record_gated_test` ("Personnel file") — `unavailableBehavior: "hidden"`, same never-firing gate.
  - `trigger_records_test`: `records_test_bootstrap` -> `unlock_record record_test`.
  - Exports `loadRecordsTestBundle()` + `createRecordsTestSession()` (boots the real engine through the bootstrap trigger).

## Window integration

`app_records` already existed in `APP_CATALOG` (launcher/taskbar); `WindowContent` now routes it to `RecordsApp`.

## Read state

- Component-local: `queryText`, submitted `searchQuery`, `selectedRecordId`; a new search clears the selection; Back clears selection and restores search-input focus; detail receives focus on open. Selection is not persisted.

## Accessibility

- Search is a native `<form role="search">` with labelled searchbox + submit; Enter submits. Available rows are buttons (aria-current on selection). Classified rows are inert `<li>`s with generic text. Back button appears only while a detail is open. Detail region is focusable (`tabIndex=-1`) and focused on open.

## Tests

- `rule-context.test.ts` (4): flags/events projection, list-to-Set conversion, no input mutation, fresh Sets per call.
- `records-model.test.ts` (17): search prompt for blank query (never a browse list), unlockedRecords ignored, ranked order preserved, no-match, defensive missing-record skip, record_opened-gated availability (absent before / present after), classified placeholder generic row, hidden records absent, classified never dereferenced into detail, detail only for available selections, evidence hidden before discovery, records-only related labels + raw fallback, source system/organization/Unknown, selection outside results -> null.
- `records-app.test.tsx` (4): search-first (no rows before query), `record_opened` emitted on open (engine history — and nothing else), classified rows generic + inert (no state change on click), record_opened-gated record appears only after an open.
- E2E `e2e/records.spec.ts` (1): launcher -> Records -> no list before query -> gated record absent before open -> search "test" -> open -> Back closes detail and restores search focus -> ferry log searchable after `record_opened` -> classified row generic/inert (no authored text leaks) -> hidden record never surfaces -> zero page errors and zero console errors. Harness route `src/app/test/records/page.tsx` mirrors `/test/mail` (PLAYWRIGHT_TEST=1 gate, h-dvh shell).

## Boundaries / deferred

- Global case search UI, mail search UI, evidence board links (BBX-050), record persistence, Case 001 authored records (BBX-100), rich-text schema ownership, evidence viewer.
- No new dependencies.

## Known limitations

- Records availability is authored in the searchable index; a locked record's title can surface only through its authored `unavailableBehavior: "classified_placeholder"` (as a sanitized row).
- Detail is tied to the current ranked results: searching again closes the current detail (selection resets on submit).
- Multi-instance Records windows share no selection state (each window is independent, matching Mail).