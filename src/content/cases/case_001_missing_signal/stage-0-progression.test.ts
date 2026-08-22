import { describe, expect, it } from "vitest";
import { stepCaseEngine } from "@/domain/engine";
import type { CaseEngineState } from "@/domain/engine";
import type { ContentBundle } from "@/content/validator";
import { loadCase001Session } from "./index";

/**
 * Stage 0 (docs/05 Stage 0 — analyst onboarding) progression tests, exercising
 * the real engine against the production Case 001 bundle.
 */

function inspectCredential(content: ContentBundle, state: CaseEngineState): CaseEngineState {
  return stepCaseEngine(state, { kind: "evidence_discovered", evidenceId: "ev_000_analyst_credential" }, content).state;
}

function confirmIdentity(content: ContentBundle, state: CaseEngineState): CaseEngineState {
  return stepCaseEngine(state, { kind: "dialogue_choice_selected", choiceId: "choice_000_confirm_identity" }, content).state;
}

describe("Case 001 Stage 0 — fresh bootstrap", () => {
  const { initialState } = loadCase001Session();

  it("starts obj_000_analyst_verification and leaves Stage 1 objectives locked", () => {
    expect(initialState.activeObjectives).toEqual(["obj_000_analyst_verification"]);
    expect(initialState.activeObjectives).not.toContain("obj_001_verify_location");
    expect(initialState.completedObjectives).toEqual([]);
  });

  it("unlocks only app_mail at bootstrap", () => {
    expect(initialState.unlockedApplications).toEqual(["app_mail"]);
    for (const appId of ["app_messenger", "app_records", "app_evidence_board", "app_objectives"]) {
      expect(initialState.unlockedApplications).not.toContain(appId);
    }
  });

  it("queues the onboarding briefing dialogue", () => {
    expect(initialState.queuedDialogue).toContain("dialogue_000_onboarding_briefing");
    expect(initialState.queuedDialogue).not.toContain("dialogue_001_sera_intro");
  });

  it("shows the briefing notification", () => {
    expect(initialState.notifications).toContain("notification_000_briefing");
  });

  it("has fired only the Stage 0 bootstrap trigger", () => {
    expect(initialState.firedTriggerIds).toEqual(["trigger_000_bootstrap"]);
  });
});

describe("Case 001 Stage 0 — credential inspection", () => {
  it("queues the identity confirmation once the credential is inspected", () => {
    const { content, initialState } = loadCase001Session();
    const state = inspectCredential(content, initialState);

    expect(state.discoveredEntityIds).toContain("ev_000_analyst_credential");
    expect(state.queuedDialogue).toContain("dialogue_000_identity_confirmation");
    expect(state.firedTriggerIds).toContain("trigger_000_credential_inspected");
    // Not completed yet — identity confirmation is still required.
    expect(state.completedObjectives).not.toContain("obj_000_analyst_verification");
  });
});

describe("Case 001 Stage 0 — identity confirmation", () => {
  it("completes obj_000 and fires trigger_001_bootstrap exactly once in the same step", () => {
    const { content, initialState } = loadCase001Session();
    const withCredential = inspectCredential(content, initialState);
    const state = confirmIdentity(content, withCredential);

    // Stage 0 objective completed.
    expect(state.completedObjectives).toContain("obj_000_analyst_verification");
    expect(state.activeObjectives).not.toContain("obj_000_analyst_verification");
    expect(state.firedTriggerIds).toContain("trigger_000_confirmation_complete");

    // Stage 1 activates in the same step: obj_001 active, apps unlocked,
    // Sera intro queued.
    expect(state.firedTriggerIds).toContain("trigger_001_bootstrap");
    expect(state.activeObjectives).toContain("obj_001_verify_location");
    for (const appId of ["app_mail", "app_messenger", "app_records", "app_evidence_board", "app_objectives"]) {
      expect(state.unlockedApplications).toContain(appId);
    }
    expect(state.queuedDialogue).toContain("dialogue_001_sera_intro");
  });

  it("does not re-fire or duplicate effects when the same inputs are stepped again", () => {
    const { content, initialState } = loadCase001Session();
    const withCredential = inspectCredential(content, initialState);
    const confirmed = confirmIdentity(content, withCredential);

    const repeatedState = confirmIdentity(content, inspectCredential(content, confirmed));

    // No duplicate triggered fires.
    const firedCount = (id: string) => repeatedState.firedTriggerIds.filter((triggerId) => triggerId === id).length;
    expect(firedCount("trigger_000_bootstrap")).toBe(1);
    expect(firedCount("trigger_000_credential_inspected")).toBe(1);
    expect(firedCount("trigger_000_confirmation_complete")).toBe(1);
    expect(firedCount("trigger_001_bootstrap")).toBe(1);

    // No duplicate queued dialogue for once-fired Stage 0/1 nodes.
    expect(repeatedState.queuedDialogue.filter((id) => id === "dialogue_000_onboarding_briefing")).toHaveLength(1);
    expect(repeatedState.queuedDialogue.filter((id) => id === "dialogue_000_identity_confirmation")).toHaveLength(1);
    expect(repeatedState.queuedDialogue.filter((id) => id === "dialogue_001_sera_intro")).toHaveLength(1);

    // Objectives do not double-complete.
    expect(repeatedState.completedObjectives).toEqual(["obj_000_analyst_verification"]);
    expect(repeatedState.activeObjectives).toEqual(["obj_001_verify_location"]);
  });
});