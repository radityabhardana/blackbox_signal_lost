import { describe, expect, it } from "vitest";
import { recordDefinitionSchema } from "./records";

const validRecord = {
  id: "record_test",
  caseId: "case_test",
  recordType: "test",
  title: "Test record",
  body: {},
  source: { system: "test" },
  createdAt: "2041-11-18T22:00:00Z",
  relatedEntityIds: [],
  searchTerms: ["test"],
  aliases: [],
  availabilityRule: { always: true },
  metadata: {},
};

describe("recordDefinitionSchema", () => {
  it("accepts a valid record with availabilityRule", () => {
    expect(recordDefinitionSchema.safeParse(validRecord).success).toBe(true);
  });

  it("rejects a record missing the required availabilityRule", () => {
    const { availabilityRule: _availabilityRule, ...missing } = validRecord;
    expect(recordDefinitionSchema.safeParse(missing).success).toBe(false);
  });

  it("accepts optional evidenceId", () => {
    expect(
      recordDefinitionSchema.safeParse({ ...validRecord, evidenceId: "ev_test" }).success,
    ).toBe(true);
  });

  it("rejects when a required field is missing", () => {
    const { title: _title, ...missing } = validRecord;
    expect(recordDefinitionSchema.safeParse(missing).success).toBe(false);
  });

  it("types metadata values strictly", () => {
    expect(recordDefinitionSchema.safeParse({ ...validRecord, metadata: { x: null } }).success).toBe(true);
    expect(recordDefinitionSchema.safeParse({ ...validRecord, metadata: { x: {} } }).success).toBe(false);
  });
});