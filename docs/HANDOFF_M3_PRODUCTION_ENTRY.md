# Session Handoff — M3 Production Entry

**Status:** Delivered. Production `/game` runs the real Case 001 session loop.

## Delivered

- Production `/game` bootstrap mounting `SessionSaveRuntime` with validated
  Case 001 content (`src/content/cases/case_001_missing_signal/index.ts`),
  authored bootstrap initial state, deterministic slot `slot_case_001`,
  channel ids, and `package.json` application version.
- Production Case 001 Stage 1 minimum content: objective
  `obj_001_verify_location` ("Verify Maya Pranata's final confirmed location"),
  two contradiction evidence items (`ev_001_ferry_departure`,
  `ev_001_emergency_call`), four initial records, Maya/Sera characters, Sera's
  intro mail, hints, conclusion/outcome stubs, placeholder assets, and a
  searchable index — all passing `contentBundleSchema` + BBX-024 validation.
- Objective progression is fully data-driven: authored triggers discover
  evidence on `record_opened` and complete the objective when both evidence
  items are discovered. No engine change was required and none was made.
- BBX-060 Objective Tracker: pure `projectObjectives` domain projection
  (`src/domain/objectives/project-objectives.ts`) + read-only `app_objectives`
  application. No second progression store.
- Taskbar case status now shows the active case title via
  `useOptionalCaseSession` ("Case: Missing Signal"; "Case: none" without a
  session).
- Production E2E proof (`e2e/case-001.spec.ts`): fresh context → /game →
  hydration ready → active objective shown → Records discovery of both
  contradiction evidence items → Evidence Board reflects them → objective
  completes from engine state → canonical board note → persistence saved →
  reload → case title, objective state, discoveries, and board note restored;
  no page or console errors.

## Ownership and boundaries

- `SessionSaveRuntime` remains the sole persistence/hydration authority
  (trusted load, slot/case/content-version gates, autosave, flush, disposal).
- `CaseSessionProvider` remains the CaseEngineState authority.
- `EvidenceBoardProvider` remains the canonical board authority.
- `CaseEngineState` is the single progression authority; `CaseManifest` is
  authored truth; Objective Tracker is read-only projection.
- No objective persistence exists outside CaseEngineState inside SaveGame V2.
- Layout persistence remains the separate localStorage presentation concern.

## Content boundary (BBX-100 Status: PARTIAL)

Stage 1 minimum slice only. Intentionally deferred: Stages 2+, Signal
Analyzer/Transit Archive/Timeline, full dialogue branches, the complete
evidence set, and later-case content (BBX-101+).

## Temporary production policy

Single deterministic local save slot `slot_case_001`. No slot UI, profiles,
cloud saves, or login. Documented until a future slot-management milestone.

## Validation

- Focused unit: projection 10 tests, Case 001 content 8 tests, Objectives app
  7 tests, production page 2 tests.
- Focused E2E: `e2e/case-001.spec.ts` (1) + smoke/notifications/evidence-board
  (5) + window-manager/layout-persistence (3) passed.
- Full Vitest: 72 files, 688 tests passed.
- Full Playwright E2E: 13 passed.
- `pnpm lint`, `pnpm typecheck`, `pnpm validate:content`, `pnpm build`, and
  `git diff --check` passed.

## Remaining scope (not part of this delivery)

- BBX-051 verified relationships, BBX-052 undo/redo, BBX-053 auto-arrange.
- BBX-061 hint ladder UI; BBX-070 Signal Analyzer; BBX-080 conclusion report;
  BBX-081 outcome evaluator; BBX-082 pre-report checkpoint.
- BBX-100 full content; BBX-101 search aliases; BBX-102 dialogue; BBX-103
  endings; BBX-104 hints; BBX-105 reachability tests.
- Settings overhaul, audio, art assets, cloud saves, login, save-slot UI.

## Recommended next task

- BBX-070 (Signal Analyzer) to continue the documented critical path
  BBX-050 → BBX-060 → BBX-100 → BBX-070 → BBX-080 → BBX-081, or continue
  BBX-100 Stage 2 content.
