import { describe, expect, it } from "vitest";
import {
  claimAnswerOptionSchema,
  claimSlotDefinitionSchema,
  conclusionDefinitionSchema,
  disclosureChoiceDefinitionSchema,
} from "./conclusion";

const baseConclusion = {
  id: "con_test",
  caseId: "case_test",
  claimSlots: [
    {
      id: "claim_001_location",
      prompt: "Where was Maya last located?",
      answerOptions: [
        { id: "claim_001_location_north_barrier", label: "North Barrier maintenance corridor", correct: true },
        { id: "claim_001_location_dorms", label: "Crew dorms" },
      ],
      optional: false,
      supportedByEvidenceIds: ["ev_001_emergency_call"],
    },
  ],
  evidenceSlotCount: 3,
  disclosureChoices: [
    {
      id: "disclosure_001_redact_maya",
      label: "Submit obstruction evidence but redact Maya's location.",
      recipient: "mio",
      redactsLocation: true,
    },
  ],
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

describe("claimAnswerOptionSchema", () => {
  it("accepts a correct answer option", () => {
    expect(claimAnswerOptionSchema.safeParse({ id: "opt_correct", label: "Right answer", correct: true }).success).toBe(true);
  });

  it("accepts a distractor without the correct marker", () => {
    expect(claimAnswerOptionSchema.safeParse({ id: "opt_distractor", label: "Wrong answer" }).success).toBe(true);
  });

  it("rejects an answer option without an id", () => {
    expect(claimAnswerOptionSchema.safeParse({ label: "No id" }).success).toBe(false);
  });

  it("rejects an unknown extra key on a strict answer option", () => {
    expect(claimAnswerOptionSchema.safeParse({ id: "opt_x", label: "X", extra: 1 }).success).toBe(false);
  });
});

describe("claimSlotDefinitionSchema", () => {
  it("rejects a claim slot without answer options", () => {
    expect(
      claimSlotDefinitionSchema.safeParse({ id: "claim_x", prompt: "Prompt", answerOptions: [] }).success,
    ).toBe(false);
  });

  it("defaults optional and supportedByEvidenceIds", () => {
    const parsed = claimSlotDefinitionSchema.parse({
      id: "claim_x",
      prompt: "Prompt",
      answerOptions: [{ id: "opt_x", label: "X" }],
    });
    expect(parsed.optional).toBe(false);
    expect(parsed.supportedByEvidenceIds).toEqual([]);
  });
});

describe("disclosureChoiceDefinitionSchema", () => {
  it("rejects a recipient outside the enum", () => {
    expect(
      disclosureChoiceDefinitionSchema.safeParse({ id: "disclosure_x", label: "X", recipient: "ciab" }).success,
    ).toBe(false);
  });
});