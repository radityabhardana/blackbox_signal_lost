import { describe, expect, it } from "vitest";
import { evaluateRule, RuleEvaluatorError } from "./index";
import type { RuleEvaluationContext } from "./index";
import type { RuleExpression } from "../../content/schemas";

function context(overrides: Partial<RuleEvaluationContext> = {}): RuleEvaluationContext {
  return {
    flags: {},
    events: [],
    discoveredEntities: new Set(),
    completedObjectives: new Set(),
    selectedChoices: new Set(),
    ...overrides,
  };
}

function deepFreeze<T>(value: T): T {
  if (value !== null && typeof value === "object") {
    for (const key of Object.keys(value)) {
      deepFreeze((value as Record<string, unknown>)[key]);
    }
    Object.freeze(value);
  }
  return value;
}

describe("evaluateRule operators", () => {
  it("always evaluates true", () => {
    expect(evaluateRule({ always: true }, context())).toBe(true);
  });

  it("all: all children true -> true", () => {
    expect(evaluateRule({ all: [{ always: true }, { always: true }] }, context())).toBe(true);
  });

  it("all: one child false -> false", () => {
    expect(evaluateRule({ all: [{ always: true }, { flagEquals: { key: "missing", value: true } }] }, context())).toBe(false);
  });

  it("all: empty -> true", () => {
    expect(evaluateRule({ all: [] }, context())).toBe(true);
  });

  it("any: one child true -> true", () => {
    expect(evaluateRule({ any: [{ entityDiscovered: "missing" }, { always: true }] }, context())).toBe(true);
  });

  it("any: all children false -> false", () => {
    expect(evaluateRule({ any: [{ flagEquals: { key: "a", value: true } }, { flagEquals: { key: "b", value: true } }] }, context())).toBe(false);
  });

  it("any: empty -> false", () => {
    expect(evaluateRule({ any: [] }, context())).toBe(false);
  });

  it("not: flips a true child", () => {
    expect(evaluateRule({ not: { always: true } }, context())).toBe(false);
  });

  it("not: flips a false child", () => {
    expect(evaluateRule({ not: { flagEquals: { key: "missing", value: 1 } } }, context())).toBe(true);
  });

  it("flagEquals: matching string", () => {
    expect(evaluateRule({ flagEquals: { key: "k", value: "v" } }, context({ flags: { k: "v" } }))).toBe(true);
  });

  it("flagEquals: matching number", () => {
    expect(evaluateRule({ flagEquals: { key: "k", value: 3 } }, context({ flags: { k: 3 } }))).toBe(true);
  });

  it("flagEquals: matching boolean", () => {
    expect(evaluateRule({ flagEquals: { key: "k", value: true } }, context({ flags: { k: true } }))).toBe(true);
  });

  it("flagEquals: mismatch", () => {
    expect(evaluateRule({ flagEquals: { key: "k", value: "v" } }, context({ flags: { k: "other" } }))).toBe(false);
  });

  it("flagEquals: missing flag -> false", () => {
    expect(evaluateRule({ flagEquals: { key: "missing", value: true } }, context())).toBe(false);
  });

  it("flagEquals: no coercion (1 !== true, '1' !== 1)", () => {
    expect(evaluateRule({ flagEquals: { key: "k", value: true } }, context({ flags: { k: 1 } }))).toBe(false);
    expect(evaluateRule({ flagEquals: { key: "k", value: 1 } }, context({ flags: { k: "1" } }))).toBe(false);
  });

  it("eventOccurred: type match", () => {
    expect(evaluateRule({ eventOccurred: { type: "record_opened" } }, context({ events: [{ type: "record_opened" }] }))).toBe(true);
  });

  it("eventOccurred: no match", () => {
    expect(evaluateRule({ eventOccurred: { type: "record_opened" } }, context())).toBe(false);
  });

  it("eventOccurred: type + entityId match", () => {
    const events = [{ type: "record_opened", entityId: "rec_1" }, { type: "record_opened", entityId: "rec_2" }];
    expect(evaluateRule({ eventOccurred: { type: "record_opened", entityId: "rec_2" } }, context({ events }))).toBe(true);
  });

  it("eventOccurred: same type, wrong entityId -> false", () => {
    const events = [{ type: "record_opened", entityId: "rec_1" }];
    expect(evaluateRule({ eventOccurred: { type: "record_opened", entityId: "rec_9" } }, context({ events }))).toBe(false);
  });

  it("eventOccurred: expression without entityId matches regardless of event entityId", () => {
    const events = [{ type: "record_opened", entityId: "anything" }];
    expect(evaluateRule({ eventOccurred: { type: "record_opened" } }, context({ events }))).toBe(true);
  });

  it("entityDiscovered: present", () => {
    expect(evaluateRule({ entityDiscovered: "ev_1" }, context({ discoveredEntities: new Set(["ev_1"]) }))).toBe(true);
  });

  it("entityDiscovered: absent", () => {
    expect(evaluateRule({ entityDiscovered: "ev_1" }, context())).toBe(false);
  });

  it("objectiveCompleted: present", () => {
    expect(evaluateRule({ objectiveCompleted: "obj_1" }, context({ completedObjectives: new Set(["obj_1"]) }))).toBe(true);
  });

  it("objectiveCompleted: absent", () => {
    expect(evaluateRule({ objectiveCompleted: "obj_1" }, context())).toBe(false);
  });

  it("choiceSelected: present", () => {
    expect(evaluateRule({ choiceSelected: "choice_1" }, context({ selectedChoices: new Set(["choice_1"]) }))).toBe(true);
  });

  it("choiceSelected: absent", () => {
    expect(evaluateRule({ choiceSelected: "choice_1" }, context())).toBe(false);
  });

  it("countAtLeast: below threshold", () => {
    const events = [{ type: "record_opened" }];
    expect(evaluateRule({ countAtLeast: { eventType: "record_opened", count: 2 } }, context({ events }))).toBe(false);
  });

  it("countAtLeast: exactly equal threshold", () => {
    const events = [{ type: "record_opened" }, { type: "record_opened" }];
    expect(evaluateRule({ countAtLeast: { eventType: "record_opened", count: 2 } }, context({ events }))).toBe(true);
  });

  it("countAtLeast: above threshold", () => {
    const events = [{ type: "record_opened" }, { type: "record_opened" }, { type: "record_opened" }];
    expect(evaluateRule({ countAtLeast: { eventType: "record_opened", count: 2 } }, context({ events }))).toBe(true);
  });

  it("countAtLeast: unrelated event types ignored", () => {
    const events = [{ type: "record_opened" }, { type: "search_performed" }, { type: "search_performed" }];
    expect(evaluateRule({ countAtLeast: { eventType: "record_opened", count: 2 } }, context({ events }))).toBe(false);
  });

  it("countAtLeast: threshold 0 with empty history -> true", () => {
    expect(evaluateRule({ countAtLeast: { eventType: "record_opened", count: 0 } }, context())).toBe(true);
  });
});

describe("evaluateRule composition and guarantees", () => {
  const nested: RuleExpression = {
    not: {
      all: [
        { any: [{ flagEquals: { key: "a", value: 1 } }, { entityDiscovered: "ev_x" }] },
        { eventOccurred: { type: "report_submitted" } },
        { countAtLeast: { eventType: "choiceSelected", count: 1 } },
      ],
    },
  };

  it("evaluates a representative deeply nested rule", () => {
    const ctx = context({
      flags: { a: 1 },
      discoveredEntities: new Set(["ev_x"]),
      events: [{ type: "choiceSelected" }],
      selectedChoices: new Set(["choice_yes"]),
    });
    expect(evaluateRule(nested, ctx)).toBe(true);
  });

  it("repeated evaluation returns the same result", () => {
    const ctx = context({ flags: { a: 1 }, events: [{ type: "choiceSelected" }] });
    const first = evaluateRule(nested, ctx);
    for (let i = 0; i < 10; i++) {
      expect(evaluateRule(nested, ctx)).toBe(first);
    }
  });

  it("does not mutate expression, flags, or events", () => {
    const expression = deepFreeze(nested);
    const ctx = context({
      flags: deepFreeze({ a: 1 }),
      events: deepFreeze([{ type: "choiceSelected" }, { type: "record_opened", entityId: "rec_1" }]),
    });
    expect(() => evaluateRule(expression, ctx)).not.toThrow();
  });

  it("does not mutate the membership sets (snapshot + size comparison)", () => {
    const discovered = new Set(["ev_x"]);
    const completed = new Set(["obj_1"]);
    const choices = new Set(["choice_yes"]);
    const snapshot = (set: ReadonlySet<string>) => ({ size: set.size, values: [...set].sort() });
    const before = [snapshot(discovered), snapshot(completed), snapshot(choices)];

    const result = evaluateRule(
      {
        all: [
          { entityDiscovered: "ev_x" },
          { objectiveCompleted: "obj_1" },
          { choiceSelected: "choice_yes" },
        ],
      },
      context({ discoveredEntities: discovered, completedObjectives: completed, selectedChoices: choices }),
    );

    expect(result).toBe(true);
    expect(snapshot(discovered)).toEqual(before[0]);
    expect(snapshot(completed)).toEqual(before[1]);
    expect(snapshot(choices)).toEqual(before[2]);
  });
});

describe("evaluateRule malformed expression handling", () => {
  it("throws RuleEvaluatorError for an empty expression", () => {
    expect(() => evaluateRule({} as RuleExpression, context())).toThrow(RuleEvaluatorError);
  });

  it("throws RuleEvaluatorError for a multi-operator expression", () => {
    expect(() =>
      evaluateRule({ always: true, flagEquals: { key: "k", value: true } } as RuleExpression, context()),
    ).toThrow(RuleEvaluatorError);
  });
});
