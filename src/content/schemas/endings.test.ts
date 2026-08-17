import { describe, expect, it } from "vitest";
import { endingDefinitionSchema } from "./endings";

const baseEnding = {
  id: "ending_001_stage1",
  caseId: "case_001_missing_signal",
  title: "Protected truth",
  body: { blocks: [{ type: "paragraph", text: "MIO opens a limited review." }] },
};

describe("endingDefinitionSchema", () => {
  it("accepts a structurally valid ending", () => {
    expect(endingDefinitionSchema.safeParse(baseEnding).success).toBe(true);
  });

  it("rejects a missing caseId", () => {
    const { caseId: _caseId, ...withoutCaseId } = baseEnding;
    expect(endingDefinitionSchema.safeParse(withoutCaseId).success).toBe(false);
  });

  it("defaults isHiddenMeta to false", () => {
    expect(endingDefinitionSchema.parse(baseEnding).isHiddenMeta).toBe(false);
  });

  it("rejects an unknown field on a closed schema", () => {
    expect(endingDefinitionSchema.safeParse({ ...baseEnding, kind: "hidden" }).success).toBe(false);
  });
});