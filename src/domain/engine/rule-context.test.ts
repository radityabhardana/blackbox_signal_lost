import { describe, expect, it } from "vitest";
import { createInitialEngineState } from "./initial-state";
import { toRuleEvaluationContext } from "./rule-context";
import type { CaseEngineState } from "./types";

function stateWith(overrides: Partial<CaseEngineState>): CaseEngineState {
  return { ...createInitialEngineState(), ...overrides };
}

describe("toRuleEvaluationContext", () => {
  it("projects flags and event history", () => {
    const ctx = toRuleEvaluationContext(
      stateWith({
        flags: { seen_intro: true },
        eventHistory: [{ type: "record_opened", entityId: "record_test" }],
      }),
    );
    expect(ctx.flags).toEqual({ seen_intro: true });
    expect(ctx.events).toEqual([{ type: "record_opened", entityId: "record_test" }]);
  });

  it("wraps membership lists into Sets", () => {
    const ctx = toRuleEvaluationContext(
      stateWith({
        discoveredEntityIds: ["evidence_test"],
        completedObjectives: ["objective_test"],
        selectedChoices: ["choice_test"],
      }),
    );
    expect([...ctx.discoveredEntities]).toEqual(["evidence_test"]);
    expect([...ctx.completedObjectives]).toEqual(["objective_test"]);
    expect([...ctx.selectedChoices]).toEqual(["choice_test"]);
  });

  it("does not mutate the input state", () => {
    const state = stateWith({ discoveredEntityIds: ["evidence_test"] });
    const before = JSON.stringify(state);
    toRuleEvaluationContext(state);
    expect(JSON.stringify(state)).toBe(before);
  });

  it("returns fresh Sets per call", () => {
    const state = stateWith({ discoveredEntityIds: ["evidence_test"] });
    const first = toRuleEvaluationContext(state);
    const second = toRuleEvaluationContext(state);
    expect(first.discoveredEntities).not.toBe(second.discoveredEntities);
    expect(first.completedObjectives).not.toBe(second.completedObjectives);
    expect(first.selectedChoices).not.toBe(second.selectedChoices);
  });
});