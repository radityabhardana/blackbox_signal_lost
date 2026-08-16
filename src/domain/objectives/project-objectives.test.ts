import { describe, expect, it } from "vitest";
import type { ObjectiveDefinition } from "@/content/schemas";
import { projectObjectives } from "./project-objectives";

function makeObjective(
  overrides: Partial<ObjectiveDefinition> & { id: string },
): ObjectiveDefinition {
  return {
    title: "Test objective",
    description: "A test objective.",
    optional: false,
    startRule: { always: true },
    completionRule: { always: true },
    hintIds: [],
    nextObjectiveIds: [],
    ...overrides,
  };
}

describe("projectObjectives", () => {
  it("projects an active objective with active status", () => {
    const defs = [makeObjective({ id: "obj_a" })];
    const result = projectObjectives({
      definitions: defs,
      activeObjectiveIds: ["obj_a"],
      completedObjectiveIds: [],
    });
    expect(result[0]!.status).toBe("active");
    expect(result[0]!.id).toBe("obj_a");
  });

  it("projects a completed objective with completed status", () => {
    const defs = [makeObjective({ id: "obj_a" })];
    const result = projectObjectives({
      definitions: defs,
      activeObjectiveIds: [],
      completedObjectiveIds: ["obj_a"],
    });
    expect(result[0]!.status).toBe("completed");
  });

  it("projects an objective not yet started as locked", () => {
    const defs = [makeObjective({ id: "obj_a" })];
    const result = projectObjectives({
      definitions: defs,
      activeObjectiveIds: [],
      completedObjectiveIds: [],
    });
    expect(result[0]!.status).toBe("locked");
  });

  it("preserves authored definition order", () => {
    const defs = [
      makeObjective({ id: "obj_second" }),
      makeObjective({ id: "obj_first" }),
      makeObjective({ id: "obj_third" }),
    ];
    const result = projectObjectives({
      definitions: defs,
      activeObjectiveIds: [],
      completedObjectiveIds: [],
    });
    expect(result.map((o) => o.id)).toEqual([
      "obj_second",
      "obj_first",
      "obj_third",
    ]);
  });

  it("skips unresolved ids in activeObjectiveIds", () => {
    const defs = [makeObjective({ id: "obj_a" })];
    const result = projectObjectives({
      definitions: defs,
      activeObjectiveIds: ["obj_a", "obj_unknown"],
      completedObjectiveIds: [],
    });
    expect(result.map((o) => o.id)).toEqual(["obj_a"]);
  });

  it("skips unresolved ids in completedObjectiveIds", () => {
    const defs = [makeObjective({ id: "obj_a" })];
    const result = projectObjectives({
      definitions: defs,
      activeObjectiveIds: [],
      completedObjectiveIds: ["obj_a", "obj_unknown"],
    });
    expect(result.map((o) => o.id)).toEqual(["obj_a"]);
  });

  it("completed wins when id appears in both active and completed lists", () => {
    const defs = [makeObjective({ id: "obj_a" })];
    const result = projectObjectives({
      definitions: defs,
      activeObjectiveIds: ["obj_a"],
      completedObjectiveIds: ["obj_a"],
    });
    expect(result[0]!.status).toBe("completed");
  });

  it("preserves the optional flag", () => {
    const defs = [makeObjective({ id: "obj_opt", optional: true })];
    const result = projectObjectives({
      definitions: defs,
      activeObjectiveIds: ["obj_opt"],
      completedObjectiveIds: [],
    });
    expect(result[0]!.optional).toBe(true);
  });

  it("returns empty array for empty definitions", () => {
    const result = projectObjectives({
      definitions: [],
      activeObjectiveIds: ["obj_a"],
      completedObjectiveIds: [],
    });
    expect(result).toEqual([]);
  });

  it("returns frozen output", () => {
    const defs = [makeObjective({ id: "obj_a" })];
    const result = projectObjectives({
      definitions: defs,
      activeObjectiveIds: ["obj_a"],
      completedObjectiveIds: [],
    });
    expect(Object.isFrozen(result)).toBe(true);
    expect(Object.isFrozen(result[0]!)).toBe(true);
  });
});
