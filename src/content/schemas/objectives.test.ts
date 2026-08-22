import { describe, expect, it } from "vitest";
import { objectiveDefinitionSchema } from "./objectives";

const baseObjective = {
  id: "obj_test",
  title: "Test objective",
  description: "A test objective.",
  optional: false,
  startRule: { always: true },
  completionRule: { always: true },
  hintIds: [],
  nextObjectiveIds: [],
};

describe("objectiveDefinitionSchema", () => {
  it("accepts a minimum valid objective", () => {
    expect(objectiveDefinitionSchema.safeParse(baseObjective).success).toBe(true);
  });

  it("accepts optional recommendedAppId and requiresHints metadata", () => {
    const withMetadata = {
      ...baseObjective,
      recommendedAppId: "app_mail",
      requiresHints: false,
    };
    const parsed = objectiveDefinitionSchema.safeParse(withMetadata);
    expect(parsed.success).toBe(true);
    if (parsed.success) {
      expect(parsed.data.recommendedAppId).toBe("app_mail");
      expect(parsed.data.requiresHints).toBe(false);
    }
  });

  it("defaults optional metadata to undefined", () => {
    const parsed = objectiveDefinitionSchema.safeParse(baseObjective);
    expect(parsed.success).toBe(true);
    if (parsed.success) {
      expect(parsed.data.recommendedAppId).toBeUndefined();
      expect(parsed.data.requiresHints).toBeUndefined();
    }
  });

  it("rejects when a required rule field is absent", () => {
    const { completionRule: _completionRule, ...missing } = baseObjective;
    expect(objectiveDefinitionSchema.safeParse(missing).success).toBe(false);
  });
});