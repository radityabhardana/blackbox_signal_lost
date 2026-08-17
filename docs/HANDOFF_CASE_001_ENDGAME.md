# Session Handoff — Case 001 Endgame: Stage 5 Masked Contact, Stage 6 Conclusion, Endings, Checkpoint & Retry

**Status:** Delivered. Production `/game` now plays the complete Case 001 investigation loop from Stage 1 through Stage 6: evidence discovery → Signal Analyzer puzzle → Stage 3 tablet decision → Stage 4 suppression investigation → Stage 5 masked contact → Stage 6 Conclusion Report → deterministic outcome evaluation → ending presentation → pre-report checkpoint retry.

## Delivered

### Stage 5 — Masked contact (BBX-100 continuation)

- Authored `dialogue_001_stage5_masked` with 4 choices: ignore / proof / identity / forward.
- **"Ask for proof"** sets `masked_proof_requested` + `masked_checksum_unlocked`; the flag-gated `trigger_005_checksum_discovery` then discovers `ev_001_checksum_record` (an anonymized checksum record, per docs/05 §5).
- **"Forward"** sets `masked_forwarded` (compliance flag consumed by Ending B's rule).
- Identity/ignore set no progression flags.

### Stage 6 — Conclusion Report (BBX-080)

- Production desktop app `app_conclusion` (`src/components/apps/conclusion/conclusion-report-app.tsx`), unlocked via authored `unlock_application` trigger after Stage 4 completes.
- Form: 4 claim slots (final confirmed location, ferry record, primary human obstruction, reason Maya returned), 3 evidence slots, 4 disclosure choices (MIO full archive / MIO redacted / Pelaga stolen-data / Open Signal leak).
- Two-step flow: **Review Report** (validated read-only confirmation) → **Submit Report**. Validation is pure (`src/domain/outcomes/report-submission.ts`): every non-optional claim answered with a valid option, ≥ `evidenceSlotCount` evidence, no duplicate evidence ids, all evidence ids resolve, disclosure choice resolves.

### Outcome evaluator (BBX-081)

- Pure `selectOutcome` (`src/domain/outcomes/evaluate-outcomes.ts`): filters outcomes whose `evaluationRule` matches engine state (via the shared BBX-021 rule context), sorts **priority descending** (declaration-order tie-break), returns the winner.
- `prepareSubmission` always emits all four `claim_*_correct` flags + `disclosure_recipient` + `disclosure_redacts`; the engine applies them as `set_flag` effects during the `report_submitted` step. Every valid report matches ≥1 outcome — **no dead end**.
- Case 001 priorities: placeholder stage-1 = 1, A protected_truth = 40, B official_compliance = 30, C public_exposure = 20, D misidentified = 10.
- Ending B matches on forwarded **or** pelaga disclosure; Ending C on open_signal leak; Ending D on any wrong claim; Ending A on all-4-correct + MIO (see Ending A decision below).

### Pre-report checkpoint & retry (BBX-082)

- Submission dispatches `checkpoint_requested → report_submitted → outcome_selected` through the engine.
- `SessionSaveRuntime.captureCheckpoint` stores an immutable `SessionSaveSnapshotV1` (engine + board) as `sessionSnapshot.checkpoint`; once captured it is preserved across all later autosaves and restored from SaveGame V2 on reload.
- Retry dispatches `checkpoint_restore_requested`; the runtime bumps `sessionEpoch` to remount the session from the checkpoint seed, stripping `submittedReport` / `selectedOutcomeId` / `caseCompleted`. A checkpoint-less restore is a defensive no-op.

### Endings & hidden BLACKBOX meta (BBX-103)

- All four ending families implemented as authored outcomes + ending content: Protected Truth (A), Official Compliance (B), Public Exposure (C), Misidentified Culprit (D).
- Hidden meta epilogue `ending_001_blackbox_meta` (`isHiddenMeta: true`) reached via `trigger_006_meta_flag`: fires only when `ev_001_isolation_event` discovered AND `masked_forwarded` NOT true AND an `outcome_selected` event occurred; sets `noticed_blackbox_intervention = true` + notification "ANALYST MODEL: RESISTS RECOMMENDED CLOSURE".

## Ownership and boundaries

- `CaseEngineState` = progression + submitted report + selected outcome + case-completed + durable checkpoint (all JSON-safe).
- Conclusion Report app = presentation + player intent; all claim/evidence/disclosure truth lives in authored `ConclusionDefinition`.
- `prepareSubmission`/`selectOutcome` = pure domain; the engine owns applying flag effects and recording the `outcome_selected` event.
- Persistence: unchanged SaveGame V2 format — `submittedReport` / `selectedOutcomeId` / `caseCompleted` use `.default(...)` (backward compatible, no V3 bump); `checkpoint` is optional/lazy self-referential. V1→V2 migration untouched.
- The checkpoint is a snapshot of committed engine state, not live form state.

## Key decisions

- **Ending A omits `disclosure_redacts` from its rule** (ADR-032): a fully-correct MIO submission without redaction must not dead-end. `redactsLocation` remains authored data for UI presentation; all-four-correct + MIO resolves to A by priority (40).
- **Meta flag gates on `outcome_selected`** (ADR-033): without the gate the trigger would fire during Stage 4 before the Stage 5 forward decision is settled.

## Validation

- Focused unit/component: `report-draft`, `report-submission`, `evaluate-outcomes`, `conclusion-report-app` (submit dispatches the 3-event pipeline; retry dispatches `checkpoint_restore_requested`), `session-save-runtime` checkpoint capture/restore/preservation, `case-001-content.test.ts` parameterized ending reachability.
- Full Vitest: **85 files, 964 tests passed** (run `pnpm test`).
- `pnpm validate:content` passes (all structural fixtures and content bundles conform).
- E2E: `e2e/case-001-endgame.spec.ts` (full production path to Ending A + reload + retry) and `e2e/case-001-endgame-harness.spec.ts` (Endings D/B/C via the guarded `/test/endgame` harness) — see task report for run confirmation.

## Intentionally deferred

- Search alias expansion (BBX-101), full dialogue polish (BBX-102), hint content completeness (BBX-104), content reachability simulation script (BBX-105), later-case content (BBX-100 remainder).
- BBX-111/112/113/114/115 (art/audio), BBX-120/121/122/123/124/125 (quality), BBX-130 (release hardening) — all untouched by this delivery.
- M4 (full vertical slice) remains open: full ending polish/assets, audio/atmosphere, and final narrative presentation are not complete.

## Recommended next task

- Continue BBX-100 remainder: search alias expansion (BBX-101) and dialogue polish (BBX-102), or move to quality milestones (BBX-120 keyboard audit, BBX-121 save-loss audit) to harden the now-complete loop toward M4.
