import { describe, expect, it } from "vitest";
import type { HintDefinition } from "@/content/schemas";
import { buildHintLadder } from "./ladder";

function makeHint(tier: 1 | 2 | 3 | 4, objectiveId = "objective_a"): HintDefinition {
  return {
    id: `hint_${tier}`,
    objectiveId,
    tier,
    text: `Hint text ${tier}`,
  };
}

function makeLadder(
  objectiveId: string,
  hints: readonly HintDefinition[],
  revealedHintIds: readonly string[] = [],
  objectiveHintIds: readonly string[] = hints.map((hint) => hint.id),
) {
  return buildHintLadder({
    objectiveId,
    objectiveHintIds,
    allHints: hints,
    revealedHintIds,
  });
}

describe("buildHintLadder", () => {
  it("reveals the first unrevealed hint in tier order", () => {
    const ladder = makeLadder("objective_a", [makeHint(1), makeHint(2), makeHint(3), makeHint(4)]);
    expect(ladder.next?.id).toBe("hint_1");
    expect(ladder.nextLabel).toBe("Refocus");
    expect(ladder.revealed).toEqual([]);
    expect(ladder.allRevealed).toBe(false);
  });

  it("sequential reveal advances through all four tiers", () => {
    const hints = [makeHint(1), makeHint(2), makeHint(3), makeHint(4)];
    const allIds = hints.map((hint) => hint.id);

    const step1 = makeLadder("objective_a", hints, ["hint_1"], allIds);
    expect(step1.next?.id).toBe("hint_2");
    expect(step1.nextLabel).toBe("Direction");

    const step2 = makeLadder("objective_a", hints, ["hint_1", "hint_2"], allIds);
    expect(step2.next?.id).toBe("hint_3");
    expect(step2.nextLabel).toBe("Connection");

    const step3 = makeLadder("objective_a", hints, ["hint_1", "hint_2", "hint_3"], allIds);
    expect(step3.next?.id).toBe("hint_4");
    expect(step3.nextLabel).toBe("Answer path");

    const step4 = makeLadder("objective_a", hints, ["hint_1", "hint_2", "hint_3", "hint_4"], allIds);
    expect(step4.next).toBeNull();
    expect(step4.nextLabel).toBeNull();
    expect(step4.allRevealed).toBe(true);
    expect(step4.revealed).toHaveLength(4);
  });

  it("tier cap — no fabricated tier 5", () => {
    const hints = [makeHint(1), makeHint(2), makeHint(3), makeHint(4)];
    const ladder = makeLadder("objective_a", hints, ["hint_1", "hint_2", "hint_3", "hint_4"]);
    expect(ladder.next).toBeNull();
    expect(ladder.nextLabel).toBeNull();
    expect(ladder.allRevealed).toBe(true);
  });

  it("duplicate reveal requests are idempotent", () => {
    const hints = [makeHint(1), makeHint(2)];
    const ladder = makeLadder("objective_a", hints, ["hint_1", "hint_1", "hint_2"]);
    expect(ladder.revealed.map((hint) => hint.id)).toEqual(["hint_1", "hint_2"]);
    expect(ladder.revealed).toHaveLength(2);
    expect(ladder.next).toBeNull();
    expect(ladder.allRevealed).toBe(true);
  });

  it("revealed history preserves authored order", () => {
    const hints = [makeHint(1), makeHint(2), makeHint(3), makeHint(4)];
    const ladder = makeLadder("objective_a", hints, ["hint_4", "hint_1"]);
    expect(ladder.revealed.map((hint) => hint.id)).toEqual(["hint_1", "hint_4"]);
    expect(ladder.next?.id).toBe("hint_2");
  });

  it("unknown ladder id yields empty state", () => {
    const ladder = buildHintLadder({
      objectiveId: "objective_a",
      objectiveHintIds: ["hint_nonexistent"],
      allHints: [makeHint(1)],
      revealedHintIds: [],
    });
    expect(ladder.hasNoHints).toBe(true);
    expect(ladder.revealed).toEqual([]);
    expect(ladder.next).toBeNull();
    expect(ladder.nextLabel).toBeNull();
    expect(ladder.allRevealed).toBe(true);
  });

  it("objective with no authored hints has clean empty state", () => {
    const ladder = buildHintLadder({
      objectiveId: "objective_a",
      objectiveHintIds: [],
      allHints: [makeHint(1)],
      revealedHintIds: [],
    });
    expect(ladder.hasNoHints).toBe(true);
    expect(ladder.revealed).toEqual([]);
    expect(ladder.next).toBeNull();
    expect(ladder.nextLabel).toBeNull();
    expect(ladder.allRevealed).toBe(true);
  });

  it("ignores hints belonging to other objectives", () => {
    const ladder = makeLadder("objective_a", [
      makeHint(1),
      makeHint(1, "objective_b"),
      makeHint(2),
      makeHint(3, "objective_b"),
      makeHint(4),
    ]);
    expect(ladder.revealed).toEqual([]);
    expect(ladder.next?.id).toBe("hint_1");
  });

  it("returns frozen output", () => {
    const ladder = makeLadder("objective_a", [makeHint(1), makeHint(2)], ["hint_1"]);
    expect(Object.isFrozen(ladder)).toBe(true);
    expect(Object.isFrozen(ladder.revealed)).toBe(true);
  });

  it("next hint id is correct after reveals", () => {
    const hints = [makeHint(1), makeHint(2), makeHint(3), makeHint(4)];
    const ladder = makeLadder("objective_a", hints, ["hint_1"]);
    expect(ladder.next?.id).toBe("hint_2");
  });
});