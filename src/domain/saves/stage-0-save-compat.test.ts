import { describe, expect, it } from "vitest";
import { loadCase001Session } from "@/content/cases/case_001_missing_signal";
import { createInitialEngineState, stepCaseEngine } from "@/domain/engine";
import type { CaseEngineState } from "@/domain/engine";
import { createInitialEvidenceBoardState, serializeEvidenceBoardSnapshot } from "@/domain/evidence-board";
import { parseSessionSaveSnapshot, parseTrustedSaveGameV2 } from "./session-save-schema";
import type { SessionSaveSnapshotV1 } from "./session-save-schema";
import { makeSave } from "@/infrastructure/persistence/save-repository.contract";

/**
 * Stage 0 save compatibility (docs/05 Stage 0).
 *
 * Legacy saves were created by the OLD initial-state derivation, which fired
 * `case_001_bootstrap` and started Stage 1 immediately. They must restore and
 * keep progressing exactly as before: Stage 0 triggers must never fire for
 * them, and the persisted state must round-trip unchanged.
 */

/** The engine state the legacy (pre-Stage-0) derivation produced at bootstrap. */
function legacyBootstrapState(): CaseEngineState {
  return {
    ...createInitialEngineState(),
    eventHistory: [{ type: "case_001_bootstrap" }],
    unlockedApplications: ["app_mail", "app_messenger", "app_records", "app_evidence_board", "app_objectives"],
    activeObjectives: ["obj_001_verify_location"],
    queuedDialogue: ["dialogue_001_sera_intro"],
    firedTriggerIds: ["trigger_001_bootstrap"],
  };
}

function snapshotOf(state: CaseEngineState): SessionSaveSnapshotV1 {
  return {
    version: 1,
    caseEngineState: state,
    evidenceBoard: serializeEvidenceBoardSnapshot(createInitialEvidenceBoardState()),
  };
}

/** Full SaveGame V2 envelope for the production case, matching a legacy save. */
function legacyEnvelope(state: CaseEngineState) {
  const { content } = loadCase001Session();
  return makeSave(CASE_SLOT, {
    contentVersion: content.case.version,
    currentCaseId: content.case.id,
    sessionSnapshot: snapshotOf(state),
  });
}

const CASE_SLOT = "slot_case_001";

describe("Stage 0 legacy-save compatibility", () => {
  it("restores a legacy bootstrap save with Stage 1 active and apps unlocked", () => {
    const { content } = loadCase001Session();
    const trusted = parseTrustedSaveGameV2(legacyEnvelope(legacyBootstrapState()));

    expect(trusted.contentVersion).toBe(content.case.version);
    expect(trusted.sessionSnapshot.caseEngineState.activeObjectives).toContain("obj_001_verify_location");
    expect(trusted.sessionSnapshot.caseEngineState.activeObjectives).not.toContain("obj_000_analyst_verification");
    expect(trusted.sessionSnapshot.caseEngineState.unlockedApplications).toEqual([
      "app_mail",
      "app_messenger",
      "app_records",
      "app_evidence_board",
      "app_objectives",
    ]);
    expect(trusted.sessionSnapshot.caseEngineState.firedTriggerIds).toContain("trigger_001_bootstrap");
    expect(trusted.sessionSnapshot.caseEngineState.queuedDialogue).toContain("dialogue_001_sera_intro");
  });

  it("keeps obj_001 active and never fires Stage 0 triggers for a legacy save", () => {
    const { content } = loadCase001Session();
    const restored = parseTrustedSaveGameV2(legacyEnvelope(legacyBootstrapState())).sessionSnapshot.caseEngineState;

    // Continue playing the legacy session: open the ferry record as usual.
    const next = stepCaseEngine(
      restored,
      { kind: "game_event", event: { type: "record_opened", entityId: "rec_001_ferry_departure" } },
      content,
    ).state;

    expect(next.activeObjectives).toContain("obj_001_verify_location");
    expect(next.activeObjectives).not.toContain("obj_000_analyst_verification");
    // No Stage 0 trigger fires on a legacy session.
    expect(next.firedTriggerIds.some((id) => id.startsWith("trigger_000_"))).toBe(false);
    // The ordinary Stage 1 flow still discovers evidence.
    expect(next.discoveredEntityIds).toContain("ev_001_ferry_departure");
  });

  it("round-trips a progressed legacy save (obj_001 + obj_002 complete) unchanged", () => {
    const progressed: CaseEngineState = {
      ...legacyBootstrapState(),
      completedObjectives: ["obj_001_verify_location", "obj_002_determine_authenticity"],
      discoveredEntityIds: ["ev_001_ferry_departure", "ev_001_emergency_call", "ev_001_replay_signature"],
      unlockedApplications: [
        "app_mail",
        "app_messenger",
        "app_records",
        "app_evidence_board",
        "app_objectives",
        "app_signal_analyzer",
      ],
      firedTriggerIds: [
        "trigger_001_bootstrap",
        "trigger_001_ferry_discovery",
        "trigger_001_emergency_discovery",
        "trigger_001_objective_complete",
        "trigger_002_stage2_activation",
        "trigger_002_authenticity_complete",
      ],
      // Stage 3 pressure is queued by trigger_003_stage3_surface.
      queuedDialogue: ["dialogue_001_sera_intro", "dialogue_001_stage3_pressure"],
      selectedChoices: ["choice_001_stage3_offline"],
      flags: { tablet_path_offline: true, ferry_record_forged: true },
    };

    const trusted = parseTrustedSaveGameV2(legacyEnvelope(progressed));
    expect(trusted.sessionSnapshot.caseEngineState).toEqual(progressed);
  });

  it("round-trips a completed-case legacy save unchanged", () => {
    const completed: CaseEngineState = {
      ...legacyBootstrapState(),
      submittedReport: { claimAnswers: { claim_001_location: "claim_001_location_north_barrier" } },
      selectedOutcomeId: "outcome_001_protected_truth",
      caseCompleted: true,
    };

    const trusted = parseTrustedSaveGameV2(legacyEnvelope(completed));
    expect(trusted.sessionSnapshot.caseEngineState).toEqual(completed);

    // Session snapshot parses standalone as well.
    const snapshot = parseSessionSaveSnapshot(snapshotOf(completed));
    expect(snapshot.caseEngineState.selectedOutcomeId).toBe("outcome_001_protected_truth");
    expect(snapshot.caseEngineState.caseCompleted).toBe(true);
  });
});