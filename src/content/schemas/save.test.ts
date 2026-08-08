import { describe, expect, it } from "vitest";
import { saveGameSchema } from "./save";

const baseSave = {
  saveSchemaVersion: 1,
  contentVersion: "1.0.0",
  applicationVersion: "1.0.0",
  slotId: "slot_test",
  updatedAt: "2041-11-18T22:00:00Z",
  currentCaseId: "case_test",
  gameEvents: [],
  sessionSnapshot: {},
  uiSnapshot: {},
  settings: {},
  checksum: "checksum_test",
};

describe("saveGameSchema", () => {
  it("accepts a structurally valid save", () => {
    expect(saveGameSchema.safeParse(baseSave).success).toBe(true);
  });

  it("requires a non-negative integer saveSchemaVersion", () => {
    expect(saveGameSchema.safeParse({ ...baseSave, saveSchemaVersion: -1 }).success).toBe(false);
  });

  it("rejects a missing required field", () => {
    const { checksum: _checksum, ...missing } = baseSave;
    expect(saveGameSchema.safeParse(missing).success).toBe(false);
  });

  it("rejects extraneous fields", () => {
    expect(saveGameSchema.safeParse({ ...baseSave, extra: 1 }).success).toBe(false);
  });
});