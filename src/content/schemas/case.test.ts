import { describe, expect, it } from "vitest";
import { caseManifestSchema } from "./case";

const baseCase = {
  id: "case_test",
  version: "1.0.0",
  title: "Test Case",
  estimatedMinutes: 30,
  entryStageId: "stage_test",
  stages: [],
  entities: [],
  objectives: [],
  triggers: [],
  outcomes: [],
  searchableIndex: [],
  assetBundleId: "bundle_test",
};

describe("caseManifestSchema", () => {
  it("accepts a structurally valid manifest", () => {
    expect(caseManifestSchema.safeParse(baseCase).success).toBe(true);
  });

  it("requires a non-negative integer estimatedMinutes", () => {
    expect(caseManifestSchema.safeParse({ ...baseCase, estimatedMinutes: -1 }).success).toBe(false);
  });

  it("rejects a missing entryStageId", () => {
    const { entryStageId: _entryStageId, ...missing } = baseCase;
    expect(caseManifestSchema.safeParse(missing).success).toBe(false);
  });
});