import { describe, expect, it } from "vitest";
import { validateContentBundle } from "@/content/validator";
import { stepCaseEngine } from "@/domain/engine";
import { CASE_001_SLOT_ID, loadCase001Session } from "./index";

describe("Case 001 content bundle", () => {
  it("loadCase001Session returns a valid ContentBundle", () => {
    const { content } = loadCase001Session();
    expect(content.case.id).toBe("case_001_missing_signal");
  });

  it("validateContentBundle passes for Case 001", () => {
    const { content } = loadCase001Session();
    expect(validateContentBundle(content).success).toBe(true);
  });

  it("bootstrap starts obj_001_verify_location", () => {
    const { initialState } = loadCase001Session();
    expect(initialState.activeObjectives).toContain("obj_001_verify_location");
  });

  it("bootstrap queues Sera intro dialogue", () => {
    const { initialState } = loadCase001Session();
    expect(initialState.queuedDialogue).toContain("dialogue_001_sera_intro");
  });

  it("bootstrap unlocks expected applications", () => {
    const { initialState } = loadCase001Session();
    for (const appId of ["app_mail", "app_records", "app_evidence_board", "app_objectives"]) {
      expect(initialState.unlockedApplications).toContain(appId);
    }
  });

  it("ferry record_opened discovers ev_001_ferry_departure", () => {
    const { content, initialState } = loadCase001Session();
    const { state } = stepCaseEngine(
      initialState,
      { kind: "game_event", event: { type: "record_opened", entityId: "rec_001_ferry_departure" } },
      content,
    );
    expect(state.discoveredEntityIds).toContain("ev_001_ferry_departure");
  });

  it("both evidence discovered completes objective", () => {
    const { content, initialState } = loadCase001Session();
    const afterFerry = stepCaseEngine(
      initialState,
      { kind: "game_event", event: { type: "record_opened", entityId: "rec_001_ferry_departure" } },
      content,
    ).state;
    const afterEmergency = stepCaseEngine(
      afterFerry,
      { kind: "game_event", event: { type: "record_opened", entityId: "rec_001_emergency_call" } },
      content,
    ).state;
    expect(afterEmergency.completedObjectives).toContain("obj_001_verify_location");
    expect(afterEmergency.activeObjectives).not.toContain("obj_001_verify_location");
  });

  it("CASE_001_SLOT_ID is exported", () => {
    expect(CASE_001_SLOT_ID).toBe("slot_case_001");
  });
});
