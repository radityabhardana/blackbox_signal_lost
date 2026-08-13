import { describe, expect, it } from "vitest";
import { createEvidenceBoardTestSession } from "./evidence-board-content";

describe("evidence board fixture", () => {
  it("discovers two valid evidence definitions through the engine", () => {
    expect(createEvidenceBoardTestSession().initialState.discoveredEntityIds).toEqual(["evidence_test", "evidence_board_test_second"]);
  });
});
