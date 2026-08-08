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

  it("rejects when a required rule field is absent", () => {
    const { completionRule: _completionRule, ...missing } = baseObjective;
    expect(objectiveDefinitionSchema.safeParse(missing).success).toBe(false);
  });
});