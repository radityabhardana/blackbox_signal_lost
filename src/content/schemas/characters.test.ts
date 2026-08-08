import { describe, expect, it } from "vitest";
import { characterDefinitionSchema, productionCharacterDefinitionSchema } from "./characters";

const validCharacter = {
  id: "char_test",
  displayName: "Test Character",
  aliases: [],
  role: "test",
  organizationIds: [],
  publicProfile: {},
  portraitAssetId: "img_test_neutral",
  searchTerms: [],
  knownEvidenceIds: [],
};

describe("characterDefinitionSchema", () => {
  it("accepts the minimum valid character", () => {
    expect(characterDefinitionSchema.safeParse(validCharacter).success).toBe(true);
  });

  it("production variant rejects privateAuthorNotes (author-only field)", () => {
    const withNotes = { ...validCharacter, privateAuthorNotes: "Hidden editorial note" };
    expect(characterDefinitionSchema.safeParse(withNotes).success).toBe(true);
    const production = productionCharacterDefinitionSchema.safeParse(withNotes);
    expect(production.success).toBe(false);
    expect(production.error?.issues[0]?.code).toBe("unrecognized_keys");
    expect(production.error?.issues[0]?.path).toEqual([]);
  });

  it("production variant accepts a clean character without privateAuthorNotes", () => {
    expect(characterDefinitionSchema.safeParse(validCharacter).success).toBe(true);
    expect(productionCharacterDefinitionSchema.safeParse(validCharacter).success).toBe(true);
  });

  it("rejects missing displayName and invalid id", () => {
    expect(characterDefinitionSchema.safeParse({ ...validCharacter, displayName: "" }).success).toBe(false);
    expect(characterDefinitionSchema.safeParse({ ...validCharacter, id: "BAD" }).success).toBe(false);
  });
});