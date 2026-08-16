import { describe, expect, it } from "vitest";
import type { SignalComparisonPuzzle } from "@/content/schemas";
import { assessSignalComparison } from "./evaluate";

function makePuzzle(overrides: Partial<SignalComparisonPuzzle> = {}): SignalComparisonPuzzle {
  return {
    kind: "signal_comparison",
    id: "puzzle_test",
    caseId: "case_test",
    title: "Test comparison",
    referenceLabel: "Normal event",
    disputedLabel: "Disputed event",
    sourceEvidenceId: "evidence_test",
    referenceRecordId: "record_test",
    solutionEvidenceId: "evidence_test_solution",
    properties: [
      { id: "prop_gate", label: "Gate device", referenceValue: "Physical terminal", disputedValue: "Replication service", decisive: true },
      { id: "prop_location", label: "Location proof", referenceValue: "Beacon and camera", disputedValue: "Beacon only", decisive: false },
      { id: "prop_signature", label: "Account signature", referenceValue: "Passenger token", disputedValue: "Administrative replay token", decisive: true },
    ],
    conclusionText: "Replay service detected.",
    ...overrides,
  };
}

describe("assessSignalComparison", () => {
  it("is correct when marked set exactly matches decisive set", () => {
    const result = assessSignalComparison(makePuzzle(), { markedPropertyIds: ["prop_gate", "prop_signature"] });
    expect(result.verdict).toEqual({ kind: "correct" });
    expect(result.conclusionText).toBe("Replay service detected.");
  });

  it("is incorrect when a decisive property is missed", () => {
    const result = assessSignalComparison(makePuzzle(), { markedPropertyIds: ["prop_gate"] });
    expect(result.verdict.kind).toBe("incorrect");
    if (result.verdict.kind === "incorrect") {
      expect(result.verdict.missingDecisiveIds).toEqual(["prop_signature"]);
      expect(result.verdict.extraMarkedIds).toEqual([]);
    }
  });

  it("is incorrect when a non-decisive property is extra-marked", () => {
    const result = assessSignalComparison(makePuzzle(), { markedPropertyIds: ["prop_gate", "prop_signature", "prop_location"] });
    expect(result.verdict.kind).toBe("incorrect");
    if (result.verdict.kind === "incorrect") {
      expect(result.verdict.extraMarkedIds).toEqual(["prop_location"]);
    }
  });

  it("is incorrect on empty selection", () => {
    const result = assessSignalComparison(makePuzzle(), { markedPropertyIds: [] });
    expect(result.verdict.kind).toBe("incorrect");
    if (result.verdict.kind === "incorrect") {
      expect(result.verdict.missingDecisiveIds).toEqual(["prop_gate", "prop_signature"]);
      expect(result.verdict.extraMarkedIds).toEqual([]);
    }
  });

  it("treats an unknown property id as an extra mark", () => {
    const result = assessSignalComparison(makePuzzle(), { markedPropertyIds: ["prop_nonexistent"] });
    expect(result.verdict.kind).toBe("incorrect");
    if (result.verdict.kind === "incorrect") {
      expect(result.verdict.extraMarkedIds).toEqual(["prop_nonexistent"]);
    }
  });

  it("dedupes duplicate selection entries", () => {
    const result = assessSignalComparison(makePuzzle(), { markedPropertyIds: ["prop_gate", "prop_gate", "prop_signature"] });
    expect(result.verdict).toEqual({ kind: "correct" });
  });

  it("is deterministic for identical inputs", () => {
    const puzzle = makePuzzle();
    const first = assessSignalComparison(puzzle, { markedPropertyIds: ["prop_gate", "prop_location"] });
    const second = assessSignalComparison(puzzle, { markedPropertyIds: ["prop_gate", "prop_location"] });
    expect(first).toEqual(second);
  });

  it("returns null conclusionText on every incorrect verdict", () => {
    const cases = [
      ["prop_gate"],
      ["prop_gate", "prop_signature", "prop_location"],
      [],
      ["prop_nonexistent"],
    ];
    for (const markedPropertyIds of cases) {
      const result = assessSignalComparison(makePuzzle(), { markedPropertyIds });
      expect(result.verdict.kind).toBe("incorrect");
      expect(result.conclusionText).toBeNull();
    }
  });

  it("treats empty selection as correct when no decisive properties exist", () => {
    const puzzle = makePuzzle({
      properties: [
        { id: "prop_a", label: "A", referenceValue: "a", disputedValue: "b", decisive: false },
        { id: "prop_b", label: "B", referenceValue: "a", disputedValue: "b", decisive: false },
      ],
    });
    const result = assessSignalComparison(puzzle, { markedPropertyIds: [] });
    expect(result.verdict).toEqual({ kind: "correct" });
    expect(result.conclusionText).toBe("Replay service detected.");
  });
});
