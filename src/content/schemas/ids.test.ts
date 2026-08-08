import { describe, expect, it } from "vitest";
import { idSchema } from "@/content/schemas/ids";

describe("idSchema", () => {
  it.each([
    ["case_test"],
    ["evidence_test_item"],
    ["char_maya_pranata"],
    ["obj_001_verify_location"],
    ["a"],
  ])("accepts a lowercase snake_case id: %s", (id) => {
    expect(idSchema.safeParse(id).success).toBe(true);
  });

  it.each([
    [""],
    ["NotSnake"],
    ["with space"],
    ["1abc"],
    ["case_001_missing_signal!"],
  ])("rejects an invalid id: `%s`", (id) => {
    expect(idSchema.safeParse(id).success).toBe(false);
  });
});