import { describe, expect, it } from "vitest";
import { triggerDefinitionSchema } from "./triggers";

const baseTrigger = {
  id: "trigger_test",
  once: true,
  priority: 1,
  rule: { always: true },
  effects: [],
};

describe("triggerDefinitionSchema", () => {
  it("accepts a valid trigger", () => {
    expect(triggerDefinitionSchema.safeParse(baseTrigger).success).toBe(true);
  });

  it("accepts one discriminated effect variant per type", () => {
    expect(
      triggerDefinitionSchema.safeParse({
        ...baseTrigger,
        effects: [{ type: "unlock_record", recordId: "record_test" }],
      }).success,
    ).toBe(true);
  });

  it("rejects a malformed effect", () => {
    expect(
      triggerDefinitionSchema.safeParse({
        ...baseTrigger,
        effects: [{ type: "set_flag" }],
      }).success,
    ).toBe(false);
  });

  it("rejects when the id has invalid syntax", () => {
    expect(triggerDefinitionSchema.safeParse({ ...baseTrigger, id: "bad id" }).success).toBe(false);
  });
});