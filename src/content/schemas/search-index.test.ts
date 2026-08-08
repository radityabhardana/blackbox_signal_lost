import { describe, expect, it } from "vitest";
import { searchIndexEntrySchema } from "./search-index";

const baseEntry = {
  entityId: "record_test",
  entityType: "record",
  title: "Test record",
  exactTerms: ["test"],
  aliases: [],
  partialTerms: [],
  unavailableBehavior: "hidden",
  availabilityRule: { always: true },
  authoredRank: 1,
};

describe("searchIndexEntrySchema", () => {
  it("accepts the minimal valid entry", () => {
    expect(searchIndexEntrySchema.safeParse(baseEntry).success).toBe(true);
  });

  it("rejects a negative ordered rank", () => {
    expect(searchIndexEntrySchema.safeParse({ ...baseEntry, authoredRank: -1 }).success).toBe(false);
  });

  it("rejects an invalid documented unavailableBehavior", () => {
    expect(searchIndexEntrySchema.safeParse({ ...baseEntry, unavailableBehavior: "invisible" }).success).toBe(false);
  });
});