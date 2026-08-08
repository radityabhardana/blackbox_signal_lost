import { describe, expect, it } from "vitest";
import { assetDefinitionSchema } from "./assets";

const validAsset = {
  id: "asset_test",
  type: "image",
  sourcePath: "assets/test/src.png",
  optimizedPath: "assets/test/opt.webp",
  license: "test",
  creator: "test",
  provenanceNote: "test",
  caseIds: ["case_test"],
  preload: "none",
};

describe("assetDefinitionSchema", () => {
  it("accepts the valid baseline fixture", () => {
    expect(assetDefinitionSchema.safeParse(validAsset).success).toBe(true);
  });

  it("rejects missing required ids and wrong preload", () => {
    expect(assetDefinitionSchema.safeParse({ ...validAsset, id: "BAD!" }).success).toBe(false);
    expect(assetDefinitionSchema.safeParse({ ...validAsset, preload: "unknown" }).success).toBe(false);
  });

  it("is strict about extraneous fields", () => {
    expect(assetDefinitionSchema.safeParse({ ...validAsset, unknown: true }).success).toBe(false);
  });
});