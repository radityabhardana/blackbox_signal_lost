import { describe, expect, it } from "vitest";
import { outcomeDefinitionSchema } from "./outcomes";

const baseOutcome = {
  id: "outcome_test",
  title: "Test outcome",
  evaluationRule: { always: true },
  priority: 1,
  endingContentId: "odocument_test",
  effects: [],
};

describe("outcomeDefinitionSchema", () => {
  it("accepts a valid outcome", () => {
    expect(outcomeDefinitionSchema.safeParse(baseOutcome).success).toBe(true);
  });

  it("rejects a missing endingContentId", () => {
    const { endingContentId: _endingContentId, ...missing } = baseOutcome;
    expect(outcomeDefinitionSchema.safeParse(missing).success).toBe(false);
  });
});