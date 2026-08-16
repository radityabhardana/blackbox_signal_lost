import { describe, expect, it } from "vitest";
import { puzzleDefinitionSchema } from "./puzzles";

const validPuzzle = {
  kind: "signal_comparison" as const,
  id: "puzzle_test_signal",
  caseId: "case_test",
  title: "Test signal comparison",
  referenceLabel: "Normal event",
  disputedLabel: "Disputed event",
  sourceEvidenceId: "evidence_test",
  referenceRecordId: "record_test",
  solutionEvidenceId: "evidence_test",
  properties: [
    { id: "property_test_gate", label: "Gate device", referenceValue: "Physical terminal", disputedValue: "Replication service", decisive: true },
    { id: "property_test_location", label: "Location proof", referenceValue: "Beacon and camera", disputedValue: "Beacon only", decisive: false },
  ],
  conclusionText: "Replay service detected.",
};

describe("puzzleDefinitionSchema", () => {
  it("accepts a valid signal_comparison puzzle", () => {
    expect(puzzleDefinitionSchema.safeParse(validPuzzle).success).toBe(true);
  });

  it("rejects an unknown kind (discriminated union)", () => {
    const result = puzzleDefinitionSchema.safeParse({ ...validPuzzle, kind: "other" });
    expect(result.success).toBe(false);
  });

  it("rejects a missing caseId", () => {
    const { caseId: _caseId, ...withoutCaseId } = validPuzzle;
    expect(puzzleDefinitionSchema.safeParse(withoutCaseId).success).toBe(false);
  });

  it("rejects a property missing decisive", () => {
    const { decisive: _decisive, ...propertyWithoutDecisive } = validPuzzle.properties[0]!;
    const result = puzzleDefinitionSchema.safeParse({
      ...validPuzzle,
      properties: [propertyWithoutDecisive],
    });
    expect(result.success).toBe(false);
  });

  it("rejects empty properties", () => {
    const result = puzzleDefinitionSchema.safeParse({ ...validPuzzle, properties: [] });
    expect(result.success).toBe(false);
  });

  it("rejects unknown extra fields (strict)", () => {
    const result = puzzleDefinitionSchema.safeParse({ ...validPuzzle, extra: "invented" });
    expect(result.success).toBe(false);
  });
});
