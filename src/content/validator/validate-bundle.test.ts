import { describe, expect, it } from "vitest";
import { execFileSync } from "node:child_process";
import { readFileSync } from "node:fs";
import path from "node:path";
import { contentBundleSchema, validateContentBundle } from "./index";
import type { ContentBundle, ValidationIssue, ValidationResult } from "./index";

const fixturesRoot = path.join(__dirname, "../fixtures/bundles");

function loadValidBundle(): ContentBundle {
  const raw = JSON.parse(readFileSync(path.join(fixturesRoot, "valid/bundle_basic_valid.json"), "utf-8"));
  return contentBundleSchema.parse(raw);
}

function loadInvalidBundle(file: string): ContentBundle {
  const raw = JSON.parse(readFileSync(path.join(fixturesRoot, "invalid", file), "utf-8"));
  return contentBundleSchema.parse(raw);
}

function codesOf(result: ValidationResult): string[] {
  if (result.success) return [];
  return result.issues.map((issue) => issue.code);
}

function issuesOf(result: ValidationResult): ValidationIssue[] {
  if (result.success) throw new Error("expected a failing validation result");
  return result.issues;
}

describe("validateContentBundle", () => {
  it("accepts a fully valid synthetic bundle", () => {
    const result = validateContentBundle(loadValidBundle());
    expect(result.success).toBe(true);
    expect(codesOf(result)).toEqual([]);
  });

  it("detects duplicate IDs within one collection", () => {
    const bundle = loadValidBundle();
    bundle.characters.push({ ...bundle.characters[0]! });
    expect(codesOf(validateContentBundle(bundle))).toContain("duplicate_id");
  });

  it("detects duplicate IDs across collections", () => {
    const bundle = loadValidBundle();
    bundle.evidence.push({ ...bundle.evidence[0]!, id: bundle.case.id });
    expect(codesOf(validateContentBundle(bundle))).toContain("duplicate_id");
  });

  it("detects an unresolved reference", () => {
    const bundle = loadValidBundle();
    bundle.case.triggers[0]!.effects[0] = { type: "unlock_record", recordId: "record_missing" };
    expect(codesOf(validateContentBundle(bundle))).toContain("reference_unresolved");
  });

  it("detects a wrong-target-kind reference", () => {
    const bundle = loadValidBundle();
    bundle.case.triggers[0]!.effects[0] = { type: "unlock_record", recordId: "evidence_test" };
    expect(codesOf(validateContentBundle(bundle))).toContain("reference_wrong_kind");
  });

  it("detects a caseId mismatch on a record", () => {
    const bundle = loadValidBundle();
    bundle.records[0]!.caseId = "case_other";
    expect(codesOf(validateContentBundle(bundle))).toContain("case_reference_mismatch");
  });

  it("detects an objective with no hints", () => {
    const bundle = loadValidBundle();
    bundle.case.objectives[0]!.hintIds = [];
    expect(codesOf(validateContentBundle(bundle))).toContain("objective_missing_hints");
  });

  it("detects an unresolved objective hint", () => {
    const bundle = loadValidBundle();
    bundle.case.objectives[0]!.hintIds = ["hint_missing"];
    expect(codesOf(validateContentBundle(bundle))).toContain("objective_hint_unresolved");
  });

  it("detects a hint/objective ownership mismatch", () => {
    const bundle = loadValidBundle();
    bundle.hints[0]!.objectiveId = "objective_final";
    expect(codesOf(validateContentBundle(bundle))).toContain("objective_hint_mismatch");
  });

  it("detects an objective listing a hint that claims another objective", () => {
    const bundle = loadValidBundle();
    bundle.case.objectives[0]!.hintIds = ["hint_test_final"];
    expect(codesOf(validateContentBundle(bundle))).toContain("objective_hint_mismatch");
  });

  it("detects an audio asset missing its transcript", () => {
    const bundle = loadValidBundle();
    const audio = bundle.assets.find((asset) => asset.type === "audio")!;
    delete audio.transcriptPath;
    expect(codesOf(validateContentBundle(bundle))).toContain("asset_missing_transcript");
  });

  it("reports multiple simultaneous issues", () => {
    const bundle = loadValidBundle();
    bundle.records[0]!.caseId = "case_other";
    bundle.case.objectives[0]!.hintIds = [];
    delete bundle.assets.find((asset) => asset.type === "audio")!.transcriptPath;
    bundle.case.triggers[0]!.effects[0] = { type: "unlock_record", recordId: "missing_record" };
    const codes = codesOf(validateContentBundle(bundle));
    expect(codes).toContain("case_reference_mismatch");
    expect(codes).toContain("objective_missing_hints");
    expect(codes).toContain("asset_missing_transcript");
    expect(codes).toContain("reference_unresolved");
  });

  it("orders issues deterministically regardless of input order", () => {
    const bundleA = loadValidBundle();
    bundleA.records[0]!.caseId = "case_other";
    bundleA.case.objectives[0]!.hintIds = [];
    const issuesA = issuesOf(validateContentBundle(bundleA));

    const bundleB = loadValidBundle();
    bundleB.case.objectives[0]!.hintIds = [];
    bundleB.records[0]!.caseId = "case_other";
    const issuesB = issuesOf(validateContentBundle(bundleB));

    expect(issuesA).toEqual(issuesB);
    for (let i = 1; i < issuesA.length; i++) {
      const key = (issue: ValidationIssue) => [issue.entityType, issue.entityId, issue.path, issue.code].join("\u0000");
      expect(key(issuesA[i - 1]!) <= key(issuesA[i]!)).toBe(true);
    }
  });

  it("does not mutate the input bundle", () => {
    const bundle = loadValidBundle();
    const before = JSON.stringify(bundle);
    const result = validateContentBundle(bundle);
    expect(JSON.stringify(bundle)).toBe(before);
    expect(result.success).toBe(true);
  });

  it("ignores opaque subtype contents", () => {
    const bundle = loadValidBundle();
    bundle.records[0]!.body = { paragraphs: [{ text: "x" }], block: { nested: true } };
    bundle.characters[0]!.publicProfile = { headline: "y", sections: [1, 2, 3] };
    bundle.case.stages = [{ internal: { id: "not_a_real_id", x: 1 } }];
    bundle.conclusions[0]!.claimSlots = [{ id: "claim_invented" }];
    expect(validateContentBundle(bundle).success).toBe(true);
  });

  it("ignores deferred and non-content references", () => {
    const bundle = loadValidBundle();
    bundle.evidence[0]!.relatedEntityIds = ["loc_missing", "char_anyone"];
    bundle.characters[0]!.organizationIds = ["org_missing"];
    bundle.dialogue[0]!.channelId = "channel_missing";
    bundle.evidence[0]!.reportClaimsSupported = ["claim_missing"];
    bundle.case.outcomes[0]!.endingContentId = "ending_missing";
    bundle.case.triggers[0]!.effects.push({ type: "unlock_application", applicationId: "app_missing" });
    bundle.case.triggers[0]!.effects.push({ type: "show_notification", notificationId: "notif_missing" });
    bundle.case.triggers[0]!.effects.push({ type: "set_flag", key: "k", value: true });
    bundle.case.triggers[0]!.rule = { eventOccurred: { type: "record_opened" } };
    expect(validateContentBundle(bundle).success).toBe(true);
  });
});

describe("bundle fixtures", () => {
  it("loads the valid bundle fixture through the schema and validator", () => {
    const bundle = loadValidBundle();
    expect(bundle.case.id).toBe("case_test");
    expect(validateContentBundle(bundle).success).toBe(true);
  });

  const invalidCases: Array<{ file: string; code: string }> = [
    { file: "bundle_dangling_reference.json", code: "reference_unresolved" },
    { file: "bundle_duplicate_id.json", code: "duplicate_id" },
    { file: "bundle_wrong_target_kind.json", code: "reference_wrong_kind" },
    { file: "bundle_bad_case_id.json", code: "case_reference_mismatch" },
    { file: "bundle_missing_hints.json", code: "objective_missing_hints" },
    { file: "bundle_audio_no_transcript.json", code: "asset_missing_transcript" },
  ];

  for (const { file, code } of invalidCases) {
    it(`rejects invalid fixture '${file}' with ${code} (structurally valid)`, () => {
      const bundle = loadInvalidBundle(file);
      expect(validateContentBundle(bundle).success).toBe(false);
      expect(codesOf(validateContentBundle(bundle))).toContain(code);
    });
  }
});

describe("validate:content integration", () => {
  it("exits 0 for the repository-valid content state", () => {
    let output = "";
    try {
      output = execFileSync("pnpm", ["validate:content"], {
        cwd: path.join(__dirname, "../../.."),
        encoding: "utf-8",
      });
    } catch (error) {
      expect((error as { status?: number }).status).toBe(0);
      return;
    }
    expect(output).toContain("all structural fixtures and content bundles conform.");
  });
});
