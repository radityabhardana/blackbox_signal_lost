# Roadmap and Backlog

## 1. Roadmap principle

The roadmap is organized by proof, not by feature count.

Each milestone must answer one risk:

1. Can the browser feel like a game workspace?
2. Can authored data drive progression?
3. Can players genuinely deduce the answer?
4. Can the project survive reloads and browser differences?
5. Does the story justify further production?

## 2. Milestones

### M0 — Pre-production lock

Deliverables:

- Product requirements
- Game design
- Narrative bible
- Case 001 truth timeline
- Art direction
- Technical design
- Data schemas
- AI workflow
- Test plan

Exit criteria:

- No unresolved contradiction in Case 001.
- Stack and scope are recorded.
- Vertical-slice acceptance criteria are approved.

### M1 — Investigation shell

Deliverables:

- Landing
- Boot
- Desktop
- Window manager
- Taskbar
- Settings
- Theme tokens
- Basic persistence

Exit criteria:

- Four dummy applications can be managed reliably.
- Keyboard navigation works.
- Layout survives reload.

### M2 — Deterministic case foundation

Deliverables:

- Content schemas
- Validation
- Case engine
- Rule evaluator
- Objectives
- Search
- Event log
- Local save

Exit criteria:

- Fixture case runs from start to outcome without story-specific component logic.
- Invalid content fails clearly.
- Save migration tests pass.

### M3 — First complete investigation loop (DONE)

Status: COMPLETED — The full Case 001 investigation loop (evidence discovery → Signal Analyzer puzzle → Stage 3 tablet choices → Stage 4 suppression → Stage 5 masked contact → Stage 6 conclusion report → deterministic outcome evaluation → pre-report checkpoint & retry) is implemented and verified end-to-end.

Deliverables:

- Mail (BBX-040 — DONE)
- Records (BBX-041 — DONE)
- Messenger (BBX-042 — DONE)
- Evidence discovery (BBX-022, BBX-050 — DONE)
- Evidence board (BBX-050 — DONE)
- Hints (BBX-061 — DONE)
- Conclusion report (BBX-080 — DONE)
- One simplified Case 001 path (Full Case 001 loop Stage 1–6 — DONE)

Exit criteria:

- A player can find evidence, form a hypothesis, submit a report, and see an outcome (VERIFIED: unit reachability tests, component tests, and E2E specs `e2e/case-001-endgame.spec.ts` & `e2e/case-001-endgame-harness.spec.ts`).
- Definition of ready: acceptance criteria pass, all unit/component/E2E tests pass (85 Vitest files / 964 tests in the latest run), save/restore across reloads verified via IndexedDB, accessibility considered (semantic landmarks, accessible form controls, ARIA status), content reachable with zero dead ends, and documentation matches implementation.

### M4 — Vertical slice

Deliverables:

- Full Case 001
- All endings
- Signal Analyzer
- Optional BLACKBOX clue
- Final narrative
- Placeholder-complete assets
- Audio and atmosphere

Exit criteria:

- 30–45 minute end-to-end case.
- No dead ends.
- All outcomes tested.

### M5 — Quality and public demo

Deliverables:

- Accessibility pass
- Performance pass
- Browser QA
- Asset polish
- Credits
- Privacy notice
- Playtest analytics adapter
- Deployment pipeline

Exit criteria:

- Public demo release checklist passes.
- Fresh-player playtest targets are measured.

### M6 — Production decision

Possible outcomes:

- Continue to Chapter 2
- Revise core loop
- Reduce scope to anthology cases
- Package as desktop/PWA
- Stop after a polished portfolio demo

Do not assume continuation before evidence.

## 3. Priority definitions

- **P0:** Blocks playable build or risks data loss
- **P1:** Required for vertical slice
- **P2:** Improves quality or replay value
- **P3:** Future candidate

## 4. Backlog

### Foundation

| ID | Priority | Task | Acceptance summary |
|---|---:|---|---|
| BBX-001 | P0 | Project foundation | Routes, strict TS, tokens, tests, build |
| BBX-002 | P1 | Design-token system | Central colors, type, spacing, z-index |
| BBX-003 | P1 | Settings model | Audio, motion, contrast, text scale |
| BBX-004 | P1 | Error boundary | Clear recovery and diagnostic code |

### Window system

| ID | Priority | Task | Acceptance summary |
|---|---:|---|---|
| BBX-010 | P0 | Window domain model | Pure tested geometry and focus rules |
| BBX-011 | P0 | Window UI | Move, resize, minimize, restore, maximize |
| BBX-012 | P1 | Taskbar and launcher | COMPLETED — keyboard and pointer support for taskbar, launcher, and window switching was delivered as part of BBX-011 Session 3; no separate implementation required |
| BBX-013 | P1 | Layout persistence | Restore and reset safely |
| BBX-014 | P2 | Window snapping | Optional after core stability |

Note: BBX-012 was audited against the BBX-011 implementation and closed as fully satisfied. The notification center and settings shortcut remain part of the taskbar contents in `docs/07_UI_UX_SPEC.md` but stay assigned to their owning milestones (BBX-043 notification center; the Settings milestone) — they are not completed and are not BBX-012 scope.

### Domain and content

| ID | Priority | Task | Acceptance summary |
|---|---:|---|---|
| BBX-020 | P0 | Zod content schemas | Valid and invalid fixtures |
| BBX-021 | P0 | Rule evaluator | All documented operators tested |
| BBX-022 | P0 | Case engine | Deterministic triggers and objectives |
| BBX-023 | P1 | Search index | Aliases, ranks, gates |
| BBX-024 | P1 | Content validator | References and reachability |
| BBX-025 | P2 | Author preview | Developer-only content inspector |

### Persistence

| ID | Priority | Task | Acceptance summary |
|---|---:|---|---|
| BBX-030 | P0 | IndexedDB save repository | Transactional versioned saves |
| BBX-031 | P0 | Autosave coordinator | Debounced and resilient |
| BBX-032 | P1 | Save migration | SaveGame V1→V2 format migration implemented in A3a; runtime hydration is implemented by BBX-050A3b |
| BBX-033 | P1 | Debug export | Non-sensitive diagnostics |
| BBX-034 | P3 | Cloud-save adapter | Deferred |

### Applications

| ID | Priority | Task | Acceptance summary |
|---|---:|---|---|
| BBX-040 | P1 | Secure Mail | Attachments and evidence events |
| BBX-041 | P1 | Records | Search, detail, metadata |
| BBX-042 | P1 | Messenger | Authored choices and triggers |
| BBX-043 | P1 | Notification center | Priority and history |
| BBX-044 | P2 | Timeline | Contradictions and inferred events |

### Evidence and deduction

| ID | Priority | Task | Acceptance summary |
|---|---:|---|---|
| BBX-050 | P1 | Evidence Board core | Nodes, edges, notes, save |
| BBX-051 | P1 | Verified relationships | Visually distinct from hypotheses |
| BBX-052 | P2 | Undo/redo | Board operations |
| BBX-053 | P2 | Auto-arrange | Stable optional layout |

BBX-050A1 (pure board domain), BBX-050B (workspace ownership), and BBX-050A3a/A3b
(SaveGame V2, migration, runtime hydration, autosave, durable board restore,
reload proof) are implemented. M3 production entry adds the validated Case 001
session bootstrap: production `/game` mounts SessionSaveRuntime with Case 001,
real IndexedDB persistence, and a production E2E proving evidence discovery,
board edit, objective progression, and their restoration across reload.
BBX-050 is DONE.

### Objectives and hints

| ID | Priority | Task | Acceptance summary |
|---|---:|---|---|
| BBX-060 | P1 | Objective tracker | DONE — data-driven projection of CaseManifest.objectives + CaseEngineState active/completed ids; read-only Objectives app (app_objectives); no second progression store; pure projection tests + component tests + production reload E2E |
| BBX-061 | P1 | Hint ladder | DONE — durable 4-tier progressive hints with authored ladders, engine-state reveal history, autosave integration, Objectives-app UI, and reload proof |

### Puzzles and conclusion

| ID | Priority | Task | Acceptance summary |
|---|---:|---|---|
| BBX-070 | P1 | Signal Analyzer | DONE — authored signal_comparison puzzle, pure domain evaluator, production Signal Analyzer app (app_signal_analyzer) gated by CaseEngineState.unlockedApplications, incorrect/retry semantics, full Stage 1 → Stage 2 production E2E with reload restore |
| BBX-071 | P2 | Puzzle adapter API | Reusable typed result contract |
| — | — | Note | BBX-071 remains unimplemented; the Stage 2 slice uses the existing generic game_event/trigger/effect architecture instead of a dedicated adapter. |
| BBX-080 | P0 | Conclusion report | DONE — production Conclusion Report app (app_conclusion): 4 claim slots (location, ferry record, obstruction, return reason) with typed answer options, 3 evidence slots validated against the case conclusion definition, 4 disclosure choices (MIO full / MIO redacted / Pelaga / Open Signal), a review step, deterministic submission, and persistence in SaveGame V2 |
| BBX-081 | P0 | Outcome evaluator | DONE — pure selectOutcome evaluator: filters outcomes whose evaluationRule matches, sorts priority DESCENDING with declaration-order tie-break, returns one winner; prepareSubmission always emits all four claim_*_correct flags plus disclosure_recipient and disclosure_redacts; every valid report matches ≥1 outcome (no dead end); all four Case 001 ending families unit- and E2E-tested |
| BBX-082 | P1 | Pre-report checkpoint | DONE — submit dispatches checkpoint_requested → report_submitted → outcome_selected; SessionSaveRuntime captures the pre-submission engine state (captureCheckpoint), retry dispatches checkpoint_restore_requested and remounts the session from the checkpoint (stripping submittedReport/selectedOutcomeId/caseCompleted); the checkpoint is preserved across autosaves and restored from SaveGame V2 on reload |

### Case 001

| ID | Priority | Task | Acceptance summary |
|---|---:|---|---|
| BBX-100 | P0 | Case content implementation | PARTIAL — Stage 1 through Stage 6 production slices implemented |
| BBX-101 | P1 | Search aliases | Natural query coverage |
| BBX-102 | P1 | Dialogue implementation | All branches reachable |
| BBX-103 | P1 | Endings | DONE — all four Case 001 outcomes (Protected Truth, Official Compliance, Public Exposure, Misidentified Culprit) and the hidden BLACKBOX meta flag (noticed_blackbox_intervention) implemented, verified via unit reachability tests and E2E ending tests |
| BBX-104 | P1 | Hint content | Every objective covered |
| BBX-105 | P1 | Content reachability tests | No dead ends |

BBX-100 remains PARTIAL: Stage 1 through Stage 6 production slices are implemented (Stage 1 contradiction discovery, Stage 2 Signal Analyzer ferry-authenticity puzzle, Stage 3 tablet decision with three branches, Stage 4 suppressed-maintenance investigation, Stage 5 masked contact with checksum discovery and compliance flags, Stage 6 Conclusion Report with 4 claims, 3 evidence slots, 4 disclosure options, and all 4 ending outcomes plus the hidden meta flag). Search alias expansion (BBX-101), full dialogue polish (BBX-102), and later-case content remain future slices.

### Art and audio

| ID | Priority | Task | Acceptance summary |
|---|---:|---|---|
| BBX-110 | P1 | Boot and shell polish | PARTIAL — original in-repo brand marks (BLACKBOX/CIAB/Pelaga + wordmark), 9 app icons, 11 system glyphs, 8 Case 001 evidence visuals, desktop civic-grid texture, launcher/taskbar/window-title/control icon integration, landing brand, and forced-colors polish shipped (BBX-110 slice 1); boot treatment, portraits, environment stills, audio, and anomaly effects remain |
| BBX-111 | P1 | Character portraits | Consistent approved sheets |
| BBX-112 | P1 | Environment stills | North Barrier and ferry |
| BBX-113 | P1 | UI sounds | Grouped and adjustable |
| BBX-114 | P1 | Adaptive ambience | Neutral, discovery, pressure |
| BBX-115 | P2 | Anomaly effects | Readable and adjustable |

### Quality

| ID | Priority | Task | Acceptance summary |
|---|---:|---|---|
| BBX-120 | P0 | Keyboard audit | Complete critical path |
| BBX-121 | P0 | Save-loss audit | No known critical path |
| BBX-122 | P1 | Browser matrix | Chrome, Edge, Firefox |
| BBX-123 | P1 | Accessibility audit | Automated and manual |
| BBX-124 | P1 | Performance profile | Budgets measured |
| BBX-125 | P1 | Content playtest | Completion and comprehension |
| BBX-130 | P0 | Release hardening | Full release checklist |

## 5. Vertical-slice critical path

```text
BBX-001
 → BBX-010
 → BBX-011
 → BBX-020
 → BBX-021
 → BBX-022
 → BBX-030
 → BBX-040
 → BBX-041
 → BBX-050
 → BBX-060
 → BBX-100
 → BBX-070
 → BBX-080
 → BBX-081
 → BBX-120
 → BBX-121
 → BBX-130
```

## 6. Definition of milestone ready

A milestone is not complete because its pages exist.

It is ready only when:

- acceptance criteria pass,
- tests pass,
- save behavior is verified,
- accessibility is considered,
- content is reachable,
- documentation matches implementation,
- and a clean-browser playthrough succeeds.
