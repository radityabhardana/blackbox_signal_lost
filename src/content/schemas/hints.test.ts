import { describe, expect, it } from "vitest";
import { hintDefinitionSchema } from "./hints";

describe("hintDefinitionSchema", () => {
  it("accepts a valid hint", () => {
    const hint = { id: "hint_test", objectiveId: "obj_test", tier: 2, text: "A hint" };
    expect(hintDefinitionSchema.safeParse(hint).success).toBe(true);
  });

  it("rejects an invalid tier", () => {
    const hint = { id: "hint_test", objectiveId: "obj_test", tier: 5, text: "A hint" };
    expect(hintDefinitionSchema.safeParse(hint).success).toBe(false);
  });
});