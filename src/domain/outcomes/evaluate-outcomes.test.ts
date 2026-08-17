import { describe, expect, it } from "vitest";
import { createInitialEngineState } from "@/domain/engine";
import type { CaseEngineState } from "@/domain/engine";
import type { OutcomeDefinition } from "@/content/schemas";
import { selectOutcome } from "./evaluate-outcomes";

function outcome(
  id: string,
  priority: number,
  evaluationRule: OutcomeDefinition["evaluationRule"],
): OutcomeDefinition {
  return {
    id,
    title: id,
    evaluationRule,
    priority,
    endingContentId: `ending_${id}`,
    effects: [],
  };
}

function stateWithFlags(flags: Record<string, string | number | boolean>): CaseEngineState {
  return { ...createInitialEngineState(), flags };
}

describe("selectOutcome", () => {
  it("returns none when no outcome matches", () => {
    const outcomes = [outcome("a", 1, { flagEquals: { key: "x", value: true } })];
    expect(selectOutcome(outcomes, stateWithFlags({}))).toEqual({ kind: "none" });
  });

  it("returns none for an empty outcome list", () => {
    expect(selectOutcome([], stateWithFlags({}))).toEqual({ kind: "none" });
  });

  it("selects the single matching outcome", () => {
    const outcomes = [outcome("a", 1, { flagEquals: { key: "x", value: true } })];
    const selection = selectOutcome(outcomes, stateWithFlags({ x: true }));
    expect(selection).toEqual({ kind: "selected", outcome: outcomes[0] });
  });

  it("picks the highest priority among multiple matches", () => {
    const low = outcome("low", 1, { always: true });
    const high = outcome("high", 9, { always: true });
    const mid = outcome("mid", 5, { always: true });
    const selection = selectOutcome([low, high, mid], stateWithFlags({}));
    expect(selection).toEqual({ kind: "selected", outcome: high });
  });

  it("breaks priority ties by declaration order", () => {
    const first = outcome("first", 3, { always: true });
    const second = outcome("second", 3, { always: true });
    const selection = selectOutcome([first, second], stateWithFlags({}));
    expect(selection).toEqual({ kind: "selected", outcome: first });
  });

  it("skips a higher-priority outcome that does not match", () => {
    const nonMatching = outcome("non_matching", 9, { flagEquals: { key: "x", value: true } });
    const matching = outcome("matching", 1, { always: true });
    const selection = selectOutcome([nonMatching, matching], stateWithFlags({}));
    expect(selection).toEqual({ kind: "selected", outcome: matching });
  });

  it("is deterministic across repeated calls", () => {
    const outcomes = [
      outcome("a", 2, { always: true }),
      outcome("b", 5, { always: true }),
      outcome("c", 5, { always: true }),
    ];
    const state = stateWithFlags({});
    const first = selectOutcome(outcomes, state);
    for (let i = 0; i < 10; i++) {
      expect(selectOutcome(outcomes, state)).toEqual(first);
    }
  });

  it("does not mutate the input outcomes array", () => {
    const outcomes = [outcome("a", 1, { always: true }), outcome("b", 5, { always: true })];
    const before = JSON.stringify(outcomes);
    selectOutcome(outcomes, stateWithFlags({}));
    expect(JSON.stringify(outcomes)).toBe(before);
  });
});
