import { describe, expect, it } from "vitest";
import { ruleExpressionSchema } from "./rule-expression";

const allOperator = (expr: unknown) => ruleExpressionSchema.safeParse(expr).success;

describe("ruleExpressionSchema", () => {
  it("accepts each documented operator exactly once", () => {
    expect(allOperator({ always: true })).toBe(true);
    expect(allOperator({ entityDiscovered: "evidence_test" })).toBe(true);
    expect(allOperator({ flagEquals: { key: "test_flag", value: "1" } })).toBe(true);
    expect(allOperator({ eventOccurred: { type: "record_opened" } })).toBe(true);
    expect(allOperator({ choiceSelected: "choice_test_yes" })).toBe(true);
    expect(allOperator({ countAtLeast: { eventType: "choiceSelected", count: 2 } })).toBe(true);
    expect(allOperator({ not: { always: true } })).toBe(true);
  });

  it("accepts nested combinations", () => {
    expect(allOperator({ all: [{ always: true }, { any: [{ not: { choiceSelected: "choice_x" } }] }] })).toBe(true);
  });

  it("rejects unknown operators and empty nodes", () => {
    expect(allOperator({ bogus: true })).toBe(false);
    expect(allOperator({})).toBe(false);
    expect(allOperator({ always: true, entityDiscovered: "x" })).toBe(false);
  });

  it("rejects unexpected fields on nested operator objects", () => {
    expect(allOperator({ flagEquals: { key: "test_flag", value: 1, junk: true } })).toBe(false);
    expect(allOperator({ eventOccurred: { type: "record_opened", junk: true } })).toBe(false);
    expect(allOperator({ countAtLeast: { eventType: "choiceSelected", count: 2, junk: true } })).toBe(false);
  });
});