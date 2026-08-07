# AI Execution Playbook

## 1. Purpose

This document turns the project plan into a controlled sequence for AI coding agents. The objective is to prevent a common failure mode: generating many impressive components before the core game loop works.

## 2. Operating model

Use one primary agent per task. A second agent may review architecture or tests, but should not simultaneously rewrite the same files.

Each task cycle:

```text
Read → Inspect → Plan → Implement → Test → Review → Document
```

## 3. Master instruction

Use this at the beginning of a new agent session:

```text
You are implementing BLACKBOX: Signal Lost.

First read README.md, AGENTS.md, docs/00_INDEX.md, docs/02_PRD.md,
docs/03_GDD.md, docs/08_TECHNICAL_DESIGN.md,
docs/09_DATA_AND_CONTENT_SCHEMA.md, and docs/16_DECISION_LOG.md.

Then inspect the existing repository. Do not assume missing files are empty.
Do not change code yet.

Return:
1. Current architecture summary.
2. Relevant files for the assigned backlog item.
3. Risks and unresolved assumptions.
4. A minimal implementation plan mapped to acceptance criteria.
5. Tests that should be added or changed.

Wait for task authorization only when a decision is genuinely missing.
Otherwise implement the smallest complete solution, run checks, and report
using the format required by AGENTS.md.
```

## 4. Execution sequence

### Session 1 — Project foundation

Task: `BBX-001`

```text
Implement BBX-001 Project Foundation.

Create the documented source folders, design-token foundation, game route,
public landing route, baseline layout, lint/typecheck/test configuration,
and a minimal smoke test.

Do not build the window manager or case content.

Acceptance criteria:
- pnpm dev starts.
- Landing and /game render.
- TypeScript strict mode is enabled.
- Theme tokens exist in one central location.
- Reduced-motion media query is represented.
- lint, typecheck, test, and build scripts exist and pass.
```

### Session 2 — Window manager domain

Task: `BBX-010`

```text
Implement a typed window-manager model before complex UI.

Support registered applications, open, focus, minimize, restore, maximize,
close, move, resize, and reset-layout actions. Keep geometry logic in pure
functions and add unit tests for viewport clamping and focus order.

Do not add story content.
```

### Session 3 — Window manager UI

Task: `BBX-011`

```text
Connect the tested window-manager domain to accessible React components.

Implement desktop, taskbar, app launcher, window frame, keyboard focus,
visible controls, and reduced-motion transitions. Add component tests and
one Playwright flow covering open, minimize, restore, and reset layout.
```

### Session 4 — Content schemas

Task: `BBX-020`

```text
Implement Zod schemas for case manifest, evidence, records, objectives,
triggers, rule expressions, game effects, dialogue, outcomes, assets, and
save data according to docs/09_DATA_AND_CONTENT_SCHEMA.md.

Include valid and invalid fixtures. Do not implement UI.
```

### Session 5 — Rule and case engine

Task: `BBX-021`

```text
Implement a deterministic rule evaluator and case engine using pure functions.

The engine must accept validated content plus typed game events, evaluate
one-time triggers in priority order, update objectives and flags, and return
serializable state. Add tests for all supported rule operators and trigger loops.
```

### Session 6 — Local save

Task: `BBX-030`

```text
Implement the SaveRepository interface and IndexedDB adapter.

Include versioned snapshots, previous-known-good preservation, checksum,
debounced autosave coordinator, and migration tests. Provide an in-memory
repository for tests. Do not add cloud sync.
```

### Session 7 — Mail and records

Task: `BBX-040`

```text
Implement Secure Mail and Records applications using fixture content.

Story-specific logic must remain in content. Support opening attachments,
searching authored index terms, discovering evidence, and emitting domain events.
Add keyboard behavior, empty states, errors, and tests.
```

### Session 8 — Evidence board

Task: `BBX-050`

```text
Implement the Evidence Board behind project-specific adapters using React Flow.

Support evidence/person/location/event/note nodes, player-created edges,
labels, notes, undo/redo, save/restore, and reset. Distinguish player hypotheses
from verified relationships. Do not auto-solve the case.
```

### Session 9 — Objective and hint UI

Task: `BBX-060`

```text
Implement objective tracking and four-tier hints from content data.

Hints must be player-requested, reviewable, and accessible. Objectives must
describe investigative goals without exposing hidden answers.
```

### Session 10 — Case 001 content pass

Task: `BBX-100`

```text
Create a playable structured-content implementation of Case 001 from
docs/05_CASE_001_MISSING_SIGNAL.md.

Begin with placeholder assets. Implement all required records, evidence,
search terms, objectives, triggers, dialogue choices, conclusion slots,
and endings. Add content reachability validation and outcome tests.
```

### Session 11 — Signal Analyzer

Task: `BBX-070`

```text
Implement the Case 001 event-signature comparison puzzle.

Provide visual and tabular representations. The puzzle must compare a normal
ferry event with Maya’s disputed event and emit a typed completion result.
Do not include realistic hacking instructions.
```

### Session 12 — Conclusion report

Task: `BBX-080`

```text
Implement the structured conclusion report.

Support claim selection, evidence slots, disclosure choice, recipient,
review confirmation, pre-submission checkpoint, deterministic outcome
evaluation, and replay from checkpoint. Add tests for every Case 001 ending.
```

### Session 13 — Narrative and audio polish

Task: `BBX-110`

```text
Apply the art and audio direction without changing case logic.

Add boot treatment, app-specific sound cues, ambience groups, portrait and
environment placeholders, anomaly effects, reduced-motion alternatives,
glitch-intensity setting, and loading behavior. Keep essential information readable.
```

### Session 14 — Accessibility and browser QA

Task: `BBX-120`

```text
Execute the accessibility and browser checklist.

Fix keyboard traps, focus order, labels, text scaling, reduced motion,
captions, contrast, and viewport recovery. Add automated axe checks where
appropriate and document remaining manual checks.
```

### Session 15 — Vertical-slice hardening

Task: `BBX-130`

```text
Treat the current build as a release candidate.

Run all tests, inspect console and network errors, test fresh and migrated
saves, validate content reachability, profile application opening and memory,
and fix only release-blocking issues. Produce a release-readiness report.
```

## 5. Review-agent prompt

```text
Review the implementation of backlog item <ID> against:
- AGENTS.md
- its acceptance criteria,
- relevant architecture documents,
- accessibility requirements,
- save compatibility,
- and existing tests.

Do not rewrite the feature immediately.

Report:
1. Blocking defects.
2. Architecture violations.
3. Missing tests.
4. Accessibility defects.
5. Scope creep.
6. A minimal patch plan.
```

## 6. Debugging prompt

```text
Investigate this bug without applying a broad refactor.

Observed behavior:
<describe>

Expected behavior:
<describe>

Reproduction:
<steps>

First trace the relevant domain event, store update, component state,
persistence boundary, and test coverage. State the most likely root cause
with evidence from the repository. Then implement the smallest fix and add
a regression test.
```

## 7. Content-authoring prompt

```text
Create content only for <case/section> using the existing schemas.

Before writing, read the narrative bible, case truth timeline, contradiction
matrix, and content rules. Do not add new canon without marking it as a proposed
change. Ensure every required deduction has evidence, every red herring can be
disconfirmed, and every search term is authored and testable.
```

## 8. Anti-patterns

Stop an agent when it:

- generates all applications in one task,
- introduces a second state-management library,
- hardcodes story progression in components,
- adds Supabase before local save works,
- copies a reference game’s interface,
- creates a full fictional internet before Case 001,
- adds procedural content generation,
- uses `any` to silence errors,
- replaces tests with manual claims,
- or performs a repository-wide redesign during bug fixing.

## 9. Session handoff

At the end of every session, update or create a handoff note containing:

```text
Task:
Completed:
Files:
Tests:
Decisions:
Known issues:
Save/schema impact:
Next recommended task:
```

Do not rely on chat history as the only project memory.