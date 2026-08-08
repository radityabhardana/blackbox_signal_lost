import { describe, expect, it } from "vitest";
import { parseContent } from "./parse";
import { idSchema } from "./ids";
import { triggerDefinitionSchema } from "./triggers";

const goodTrigger = {
  id: "trigger_test",
  once: true,
  priority: 1,
  rule: { always: true },
  effects: [],
};

describe("parseContent", () => {
  it("returns data for a structurally valid artifact", () => {
    const result = parseContent(idSchema, "case_test", { entityType: "id" });
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data).toBe("case_test");
    }
  });

  it("formats structural issues with entity context", () => {
    const result = parseContent(triggerDefinitionSchema, { ...goodTrigger, rule: { bogus: true } }, {
      entityType: "trigger",
      entityId: "trigger_bad",
    });
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.issues[0]).toMatchObject({
        entityType: "trigger",
        entityId: "trigger_bad",
        code: "unrecognized_keys",
        path: "rule",
      });
      expect(result.issues[0]?.reason.length).toBeGreaterThan(0);
    }
  });
});