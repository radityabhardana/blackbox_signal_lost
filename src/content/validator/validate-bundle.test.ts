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

  it("accepts a conclusion with a typed claim, disclosure, and resolving refs", () => {
    const bundle = loadValidBundle();
    bundle.conclusions[0]!.claimSlots = [
      {
        id: "claim_001_location",
        prompt: "Where was Maya last located?",
        answerOptions: [
          { id: "claim_001_location_north_barrier", label: "North Barrier maintenance corridor", correct: true },
          { id: "claim_001_location_dorms", label: "Crew dorms" },
        ],
        optional: false,
        supportedByEvidenceIds: ["evidence_test"],
      },
    ];
    bundle.conclusions[0]!.disclosureChoices = [
      {
        id: "disclosure_001_redact_maya",
        label: "Submit obstruction evidence but redact Maya's location.",
        recipient: "mio",
        redactsLocation: true,
      },
    ];
    bundle.evidence[0]!.reportClaimsSupported = ["claim_001_location"];
    expect(validateContentBundle(bundle).success).toBe(true);
  });

  it("detects reportClaimsSupported referencing a claim id that does not exist", () => {
    const bundle = loadValidBundle();
    bundle.evidence[0]!.reportClaimsSupported = ["claim_missing"];
    const result = validateContentBundle(bundle);
    expect(result.success).toBe(false);
    expect(issuesOf(result)).toContainEqual(
      expect.objectContaining({
        code: "reference_unresolved",
        entityType: "evidence",
        entityId: "evidence_test",
        path: "reportClaimsSupported",
        referencedId: "claim_missing",
      }),
    );
  });

  it("detects an outcome endingContentId referencing a missing ending", () => {
    const bundle = loadValidBundle();
    bundle.case.outcomes[0]!.endingContentId = "ending_missing";
    const result = validateContentBundle(bundle);
    expect(result.success).toBe(false);
    expect(issuesOf(result)).toContainEqual(
      expect.objectContaining({
        code: "reference_unresolved",
        entityType: "outcome",
        entityId: "outcome_test",
        path: "endingContentId",
        referencedId: "ending_missing",
      }),
    );
  });

  it("detects a claim supportedByEvidenceIds referencing missing evidence", () => {
    const bundle = loadValidBundle();
    bundle.conclusions[0]!.claimSlots = [
      {
        id: "claim_001_location",
        prompt: "Where was Maya last located?",
        answerOptions: [{ id: "claim_001_location_north_barrier", label: "North Barrier maintenance corridor", correct: true }],
        optional: false,
        supportedByEvidenceIds: ["evidence_missing"],
      },
    ];
    const result = validateContentBundle(bundle);
    expect(result.success).toBe(false);
    expect(issuesOf(result)).toContainEqual(
      expect.objectContaining({
        code: "reference_unresolved",
        entityType: "conclusion",
        entityId: "conclusion_test",
        path: "claimSlots[0].supportedByEvidenceIds",
        referencedId: "evidence_missing",
      }),
    );
  });

  it("detects reportClaimsSupported pointing at a record instead of a claim", () => {
    const bundle = loadValidBundle();
    bundle.evidence[0]!.reportClaimsSupported = ["record_test"];
    const result = validateContentBundle(bundle);
    expect(result.success).toBe(false);
    expect(issuesOf(result)).toContainEqual(
      expect.objectContaining({
        code: "reference_wrong_kind",
        entityType: "evidence",
        entityId: "evidence_test",
        path: "reportClaimsSupported",
        referencedId: "record_test",
      }),
    );
  });

  it("detects duplicate claim ids across conclusions", () => {
    const bundle = loadValidBundle();
    const typedClaim = {
      id: "claim_001_location",
      prompt: "Where was Maya last located?",
      answerOptions: [{ id: "claim_001_location_north_barrier", label: "North Barrier maintenance corridor", correct: true }],
      optional: false,
      supportedByEvidenceIds: [] as string[],
    };
    bundle.conclusions[0]!.claimSlots = [typedClaim];
    bundle.conclusions.push({
      ...bundle.conclusions[0]!,
      id: "conclusion_other",
      claimSlots: [{ ...typedClaim }],
    });
    expect(codesOf(validateContentBundle(bundle))).toContain("duplicate_id");
  });

  it("detects an ending whose caseId does not match the manifest", () => {
    const bundle = loadValidBundle();
    bundle.endings[0]!.caseId = "case_other";
    expect(codesOf(validateContentBundle(bundle))).toContain("case_reference_mismatch");
  });

  it("defaults endings to an empty array for bundles without them", () => {
    const raw = JSON.parse(readFileSync(path.join(fixturesRoot, "valid/bundle_basic_valid.json"), "utf-8"));
    delete raw.endings;
    const bundle = contentBundleSchema.parse(raw);
    expect(bundle.endings).toEqual([]);
  });

  it("ignores opaque subtype contents and deferred references", () => {
    const bundle = loadValidBundle();
    bundle.records[0]!.body = { paragraphs: [{ text: "x" }], block: { nested: true } };
    bundle.characters[0]!.publicProfile = { headline: "y", sections: [1, 2, 3] };
    bundle.case.stages = [{ internal: { id: "not_a_real_id", x: 1 } }];
    bundle.evidence[0]!.relatedEntityIds = ["loc_missing", "char_anyone"];
    bundle.characters[0]!.organizationIds = ["org_missing"];
    bundle.dialogue[0]!.channelId = "channel_missing";
    bundle.case.triggers[0]!.effects.push({ type: "unlock_application", applicationId: "app_missing" });
    bundle.case.triggers[0]!.effects.push({ type: "set_flag", key: "k", value: true });
    bundle.case.triggers[0]!.rule = { eventOccurred: { type: "record_opened" } };
    expect(validateContentBundle(bundle).success).toBe(true);
  });

  it("accepts a valid show_notification reference", () => {
    const bundle = loadValidBundle();
    bundle.notifications.push({
      id: "notification_test",
      text: "Test notification.",
      priority: "informational",
    });
    bundle.case.triggers[0]!.effects.push({ type: "show_notification", notificationId: "notification_test" });
    expect(validateContentBundle(bundle).success).toBe(true);
  });

  it("detects an unresolved show_notification reference", () => {
    const bundle = loadValidBundle();
    bundle.case.triggers[0]!.effects.push({ type: "show_notification", notificationId: "notification_missing" });
    expect(codesOf(validateContentBundle(bundle))).toContain("reference_unresolved");
  });

  it("detects a show_notification reference to the wrong entity kind", () => {
    const bundle = loadValidBundle();
    bundle.case.triggers[0]!.effects.push({ type: "show_notification", notificationId: "record_test" });
    expect(codesOf(validateContentBundle(bundle))).toContain("reference_wrong_kind");
  });

  it("detects duplicate notification ids", () => {
    const bundle = loadValidBundle();
    bundle.notifications.push(
      { id: "notification_test", text: "First notification.", priority: "informational" },
      { id: "notification_test", text: "Second notification.", priority: "urgent" },
    );
    expect(codesOf(validateContentBundle(bundle))).toContain("duplicate_id");
  });

  it("keeps notification ids in the global uniqueness registry", () => {
    const bundle = loadValidBundle();
    bundle.notifications.push({ id: "record_test", text: "Collision.", priority: "informational" });
    expect(codesOf(validateContentBundle(bundle))).toContain("duplicate_id");
  });

  it("defaults notifications to an empty array for bundles without them", () => {
    const bundle = loadValidBundle();
    expect(bundle.notifications).toEqual([]);
    expect(validateContentBundle(bundle).success).toBe(true);
  });

  it("defaults puzzles to an empty array for bundles without them", () => {
    const bundle = loadValidBundle();
    expect(bundle.puzzles).toEqual([]);
    expect(validateContentBundle(bundle).success).toBe(true);
  });

  it("accepts a valid signal_comparison puzzle", () => {
    const bundle = loadValidBundle();
    bundle.puzzles.push({
      kind: "signal_comparison",
      id: "puzzle_test_signal",
      caseId: "case_test",
      title: "Test signal comparison",
      referenceLabel: "Normal event",
      disputedLabel: "Disputed event",
      sourceEvidenceId: "evidence_test",
      referenceRecordId: "record_test",
      solutionEvidenceId: "evidence_test",
      properties: [
        {
          id: "property_test_gate",
          label: "Gate device",
          referenceValue: "Physical terminal",
          disputedValue: "Replication service",
          decisive: true,
        },
      ],
      conclusionText: "Replay service detected.",
    });
    expect(validateContentBundle(bundle).success).toBe(true);
  });

  it("detects an unresolved puzzle solutionEvidenceId", () => {
    const bundle = loadValidBundle();
    bundle.puzzles.push({
      kind: "signal_comparison",
      id: "puzzle_test_signal",
      caseId: "case_test",
      title: "Test signal comparison",
      referenceLabel: "Normal event",
      disputedLabel: "Disputed event",
      sourceEvidenceId: "evidence_test",
      referenceRecordId: "record_test",
      solutionEvidenceId: "evidence_missing",
      properties: [
        {
          id: "property_test_gate",
          label: "Gate device",
          referenceValue: "Physical terminal",
          disputedValue: "Replication service",
          decisive: true,
        },
      ],
      conclusionText: "Replay service detected.",
    });
    const result = validateContentBundle(bundle);
    expect(result.success).toBe(false);
    expect(issuesOf(result)).toContainEqual(
      expect.objectContaining({
        code: "reference_unresolved",
        entityType: "puzzle",
        entityId: "puzzle_test_signal",
        path: "solutionEvidenceId",
        referencedId: "evidence_missing",
      }),
    );
  });

  it("detects a puzzle sourceEvidenceId pointing at the wrong entity kind", () => {
    const bundle = loadValidBundle();
    bundle.puzzles.push({
      kind: "signal_comparison",
      id: "puzzle_test_signal",
      caseId: "case_test",
      title: "Test signal comparison",
      referenceLabel: "Normal event",
      disputedLabel: "Disputed event",
      sourceEvidenceId: "record_test",
      referenceRecordId: "record_test",
      solutionEvidenceId: "evidence_test",
      properties: [
        {
          id: "property_test_gate",
          label: "Gate device",
          referenceValue: "Physical terminal",
          disputedValue: "Replication service",
          decisive: true,
        },
      ],
      conclusionText: "Replay service detected.",
    });
    const result = validateContentBundle(bundle);
    expect(result.success).toBe(false);
    expect(issuesOf(result)).toContainEqual(
      expect.objectContaining({
        code: "reference_wrong_kind",
        entityType: "puzzle",
        entityId: "puzzle_test_signal",
        path: "sourceEvidenceId",
        referencedId: "record_test",
      }),
    );
  });
});

describe("bundle fixtures", () => {
  it("loads the valid bundle fixture through the schema and validator", () => {
    const bundle = loadValidBundle();
    expect(bundle.case.id).toBe("case_test");
    expect(validateContentBundle(bundle).success).toBe(true);
  });

  it("loads the notifications bundle fixture through the schema and validator", () => {
    const raw = JSON.parse(readFileSync(path.join(fixturesRoot, "valid/bundle_notifications_valid.json"), "utf-8"));
    const bundle = contentBundleSchema.parse(raw);
    expect(bundle.notifications).not.toEqual([]);
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
