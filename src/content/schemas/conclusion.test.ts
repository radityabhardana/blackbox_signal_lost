import { describe, expect, it } from "vitest";
import { conclusionDefinitionSchema } from "./conclusion";

const baseConclusion = {
  id: "con_test",
  caseId: "case_test",
  claimSlots: [],
  evidenceSlotCount: 3,
  disclosureChoices: [],
};

describe("conclusionDefinitionSchema", () => {
  it("accepts a structurally valid conclusion", () => {
    expect(conclusionDefinitionSchema.safeParse(baseConclusion).success).toBe(true);
  });

  it("rejects a negative evidenceSlotCount", () => {
    expect(conclusionDefinitionSchema.safeParse({ ...baseConclusion, evidenceSlotCount: -1 }).success).toBe(false);
  });

  it("rejects an unexpected field on a closed schema", () => {
    expect(conclusionDefinitionSchema.safeParse({ ...baseConclusion, extra: 1 }).success).toBe(false);
  });
});