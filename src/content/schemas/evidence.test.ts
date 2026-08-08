import { describe, expect, it } from "vitest";
import { evidenceDefinitionSchema } from "./evidence";

const baseEvidence = {
  id: "ev_test",
  caseId: "case_test",
  title: "Test evidence",
  type: "document",
  summary: "Test evidence",
  source: { system: "test" },
  tags: ["test"],
  relatedEntityIds: [],
  assetIds: [],
  optional: false,
  contested: false,
  redHerring: false,
  reportClaimsSupported: [],
};

const referenceDiscovery = {
  ...baseEvidence,
  discoveryRule: { always: true },
};

describe("evidenceDefinitionSchema", () => {
  it("accepts a valid evidence item", () => {
    expect(evidenceDefinitionSchema.safeParse(referenceDiscovery).success).toBe(true);
  });

  it("rejects unknown evidence types", () => {
    expect(evidenceDefinitionSchema.safeParse({ ...referenceDiscovery, type: "hologram" }).success).toBe(false);
  });

  it("rejects a missing summary (required) and bad id syntax", () => {
    const { summary: _summary, ...noSummary } = referenceDiscovery;
    expect(evidenceDefinitionSchema.safeParse(noSummary).success).toBe(false);
    expect(evidenceDefinitionSchema.safeParse({ ...referenceDiscovery, id: "bad id" }).success).toBe(false);
  });

  it("rejects unexpected fields", () => {
    expect(evidenceDefinitionSchema.safeParse({ ...referenceDiscovery, deprecated: true }).success).toBe(false);
  });
});