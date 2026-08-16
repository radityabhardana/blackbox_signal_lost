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

  it("Stage 2 objective exists and validates", () => {
    const { content } = loadCase001Session();
    const ids = content.case.objectives.map((objective) => objective.id);
    expect(ids).toContain("obj_002_determine_authenticity");
  });

  it("Stage 1 completion activates Stage 2 in one engine step", () => {
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
    expect(afterEmergency.activeObjectives).toContain("obj_002_determine_authenticity");
    expect(afterEmergency.unlockedApplications).toContain("app_signal_analyzer");
  });

  it("puzzle_completed completes Stage 2 and discovers replay signature", () => {
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
    const afterPuzzle = stepCaseEngine(
      afterEmergency,
      { kind: "game_event", event: { type: "puzzle_completed", entityId: "puzzle_001_ferry_authenticity" } },
      content,
    ).state;
    expect(afterPuzzle.completedObjectives).toContain("obj_002_determine_authenticity");
    expect(afterPuzzle.activeObjectives).not.toContain("obj_002_determine_authenticity");
    expect(afterPuzzle.discoveredEntityIds).toContain("ev_001_replay_signature");
    expect(afterPuzzle.flags.ferry_record_forged).toBe(true);
  });

  it("puzzle references resolve to bundle entities", () => {
    const { content } = loadCase001Session();
    const puzzle = content.puzzles[0]!;
    const evidenceIds = content.evidence.map((evidence) => evidence.id);
    const recordIds = content.records.map((record) => record.id);
    expect(evidenceIds).toContain(puzzle.sourceEvidenceId);
    expect(evidenceIds).toContain(puzzle.solutionEvidenceId);
    expect(recordIds).toContain(puzzle.referenceRecordId);
  });

  it("decisive properties are exactly gate device and account signature", () => {
    const { content } = loadCase001Session();
    const decisiveIds = content.puzzles[0]!.properties.filter((property) => property.decisive).map((property) => property.id);
    expect(decisiveIds).toEqual(["property_gate_device", "property_account_signature"]);
  });

  it("no Stage 3+ scope creep", () => {
    const { content } = loadCase001Session();
    expect(content.puzzles).toHaveLength(1);
    expect(content.puzzles[0]!.id).toBe("puzzle_001_ferry_authenticity");
    expect(content.case.objectives).toHaveLength(2);
    expect(new Set(content.evidence.map((evidence) => evidence.id))).toEqual(
      new Set(["ev_001_ferry_departure", "ev_001_emergency_call", "ev_001_replay_signature"]),
    );
  });
});
