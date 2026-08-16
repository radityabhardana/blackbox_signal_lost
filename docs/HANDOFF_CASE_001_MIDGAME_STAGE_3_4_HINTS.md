# Session Handoff — Case 001 Midgame: Stage 3 + Stage 4 + BBX-061 Hint Ladder

**Status:** Delivered. Production /game now plays the Stage 2 → Stage 3 → Stage 4 midgame including the three-branch tablet decision and the durable four-tier hint ladder.

## Delivered

- Stage 3 "Human Pressure": Sera's damaged-tablet decision via Messenger
  (dialogue_001_stage3_pressure, 3 choices), surfaced by an authored trigger
  after Stage 2 completes. Each choice commits exactly one boolean branch flag
  (tablet_path_ciab / tablet_path_offline / tablet_path_pelaga) and queues its
  follow-up reply. Messenger enforces node-level choice exclusivity
  (choicesResolved: selecting any choice disables all siblings, from engine
  selectedChoices). Option 2 also sets sera_trust_increased (authored boolean
  recording the documented trust consequence; permitted by ADR-008, never
  displayed, currently unread by any rule — a progression seed for future
  content) and unlocks ev_001_diagnostic_note via the flag-gated trigger on
  tablet_path_offline.
- Stage 4 "Suppressed Maintenance Data": objective
  obj_003_reason_for_north_barrier ("Identify why Maya entered North Barrier
  after curfew") activates on ANY branch; completion requires exactly
  {ev_001_node7_summary, ev_001_manual_escalation, ev_001_corridor_access} via
  an authored all-evidence trigger. Records added: Node 7 maintenance summary,
  manual escalation ticket, corridor access log, public reliability report
  (authored omission metadata). ev_001_diagnostic_note (Option 2) and
  ev_001_isolation_event (optional/meta companion) never gate completion.
- BBX-061 Hint Ladder: durable reveal history in
  CaseEngineState.revealedHintIds (new hint_revealed EngineInput; schema
  `.default([])` — backward compatible with existing V2 saves, no migration);
  "hint_revealed" AutosaveReason + runtime branch; pure src/domain/hints
  projection (tier labels Refocus/Direction/Connection/Answer path per
  docs/03 §5.9); Objectives-app Hint button (active objectives, tier-advancing,
  "All hints revealed" at exhaustion) + reviewable history; completed
  objectives show history only. Full 4-tier authored ladders for all three
  objectives (12 hints in hints.ts).

## Ownership and boundaries

- CaseEngineState = progression + committed choice + durable hint history.
- Messenger = presentation + player choice intent (sibling-disable derived
  from engine state, no local state).
- Objectives = progression projection + hint UI (no second store).
- Puzzle truth, choice consequences, evidence gating: all authored content.
- Persistence: unchanged SaveGame V2 format (hint field default-compatible);
  branch flags in the flags record; evidence/objectives/choices as before.
  Analyzer selections remain transient. Layout remains localStorage-owned.

## Documented source gaps (not fabricated)

- Which data Option 1 (CIAB) redacts: unspecified in any doc — represented
  only by the tablet_path_ciab flag.
- Which optional record Option 3 (Pelaga) removes: unspecified — no record is
  removed this slice; the availabilityRule flagEquals mechanism remains the
  future hook.
- Reno's exact response content: unspecified — the Option 3 reply stays
  within docs/05's "Reno responds quickly".

## Validation

- Focused unit: hint ladder domain 10, Objectives app hint UI 9, Messenger
  exclusivity 8, Case 001 content 24 (parameterized no-dead-end proof over
  all 3 branches), engine hint input 4, save-compat 2, runtime autosave 1.
- Full Vitest: 76 files, 768 tests passed (final orchestrator serial run
  confirms exact counts).
- E2E: e2e/case-001-midgame.spec.ts (Option 2 branch, full midgame loop +
  reload restore) passes; existing 14 E2E remain green.
- pnpm lint / typecheck / validate:content / build / git diff --check pass.

## Intentionally deferred

- Stage 5 masked contact, Stage 6 conclusion, endings (BBX-100 remainder;
  BBX-080/081/082).
- ev_001_damaged_tablet evidence (docs Conditional row) — needs its own Stage 3
  tablet content path; optional boundary preserved without it.
- BBX-044 Timeline, Transit Archive app, BBX-051/052/053, BBX-071.
- Full dialogue branches and later-case content.

## Recommended next task

- Stage 5 (masked contact) + Stage 6 (conclusion) to continue BBX-100, or
  BBX-080 Conclusion Report for the critical path
  BBX-050 → BBX-060 → BBX-100 → BBX-070 → BBX-080 → BBX-081.