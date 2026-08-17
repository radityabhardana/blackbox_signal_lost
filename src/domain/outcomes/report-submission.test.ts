import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import path from "node:path";
import { contentBundleSchema } from "@/content/validator";
import type { ContentBundle } from "@/content/validator";
import type { ConclusionDefinition } from "@/content/schemas";
import {
  attachEvidence,
  createEmptyReportDraft,
  selectClaimAnswer,
  selectDisclosure,
} from "./report-draft";
import { prepareSubmission, validateReportDraft } from "./report-submission";

const bundlePath = path.join(__dirname, "../../content/fixtures/bundles/valid/bundle_basic_valid.json");

function loadBundle(): ContentBundle {
  return contentBundleSchema.parse(JSON.parse(readFileSync(bundlePath, "utf-8")));
}

const conclusion: ConclusionDefinition = {
  id: "conclusion_test",
  caseId: "case_test",
  claimSlots: [
    {
      id: "claim_suspect",
      prompt: "Who did it?",
      answerOptions: [
        { id: "opt_nara", label: "Nara", correct: true },
        { id: "opt_pelaga", label: "Pelaga" },
      ],
      optional: false,
      supportedByEvidenceIds: [],
    },
    {
      id: "claim_optional",
      prompt: "Optional detail",
      answerOptions: [{ id: "opt_x", label: "X", correct: true }],
      optional: true,
      supportedByEvidenceIds: [],
    },
  ],
  evidenceSlotCount: 1,
  disclosureChoices: [
    { id: "disclosure_open", label: "Open signal", recipient: "open_signal", redactsLocation: false },
    { id: "disclosure_mio", label: "Mio only", recipient: "mio", redactsLocation: true },
  ],
};

function bundleWithConclusion(): ContentBundle {
  const bundle = loadBundle();
  bundle.conclusions = [conclusion];
  return bundle;
}

function validDraft() {
  return selectDisclosure(
    attachEvidence(selectClaimAnswer(createEmptyReportDraft(), "claim_suspect", "opt_nara"), "evidence_test"),
    "disclosure_open",
  );
}

describe("validateReportDraft", () => {
  it("accepts a complete valid draft", () => {
    const result = validateReportDraft(validDraft(), bundleWithConclusion());
    expect(result.valid).toBe(true);
    expect(result.errors).toEqual([]);
  });

  it("fails when a required claim has no answer", () => {
    const draft = selectDisclosure(attachEvidence(createEmptyReportDraft(), "evidence_test"), "disclosure_open");
    const result = validateReportDraft(draft, bundleWithConclusion());
    expect(result.valid).toBe(false);
    expect(result.errors).toContain("claim 'claim_suspect' requires an answer");
  });

  it("does not require an answer for an optional claim", () => {
    const result = validateReportDraft(validDraft(), bundleWithConclusion());
    expect(result.errors.some((error) => error.includes("claim_optional"))).toBe(false);
  });

  it("fails when a claim answer is not a valid option", () => {
    const draft = selectDisclosure(
      attachEvidence(selectClaimAnswer(createEmptyReportDraft(), "claim_suspect", "opt_unknown"), "evidence_test"),
      "disclosure_open",
    );
    const result = validateReportDraft(draft, bundleWithConclusion());
    expect(result.valid).toBe(false);
    expect(result.errors).toContain("claim 'claim_suspect' has answer 'opt_unknown' which is not a valid option");
  });

  it("fails when evidence count is below evidenceSlotCount", () => {
    const draft = selectDisclosure(selectClaimAnswer(createEmptyReportDraft(), "claim_suspect", "opt_nara"), "disclosure_open");
    const result = validateReportDraft(draft, bundleWithConclusion());
    expect(result.valid).toBe(false);
    expect(result.errors.some((error) => error.includes("at least 1 evidence"))).toBe(true);
  });

  it("fails on duplicate evidence ids", () => {
    const base = selectClaimAnswer(createEmptyReportDraft(), "claim_suspect", "opt_nara");
    const draft = selectDisclosure(attachEvidence(attachEvidence(base, "evidence_test"), "evidence_test"), "disclosure_open");
    // attachEvidence dedupes, so build the duplicate manually to exercise the rule.
    const duplicated = { ...draft, evidenceIds: ["evidence_test", "evidence_test"] };
    const result = validateReportDraft(duplicated, bundleWithConclusion());
    expect(result.valid).toBe(false);
    expect(result.errors).toContain("duplicate evidence id 'evidence_test'");
  });

  it("fails on an unknown evidence id", () => {
    const draft = selectDisclosure(
      attachEvidence(selectClaimAnswer(createEmptyReportDraft(), "claim_suspect", "opt_nara"), "evidence_missing"),
      "disclosure_open",
    );
    const result = validateReportDraft(draft, bundleWithConclusion());
    expect(result.valid).toBe(false);
    expect(result.errors).toContain("evidence id 'evidence_missing' does not exist in case content");
  });

  it("fails when no disclosure is selected", () => {
    const draft = attachEvidence(selectClaimAnswer(createEmptyReportDraft(), "claim_suspect", "opt_nara"), "evidence_test");
    const result = validateReportDraft(draft, bundleWithConclusion());
    expect(result.valid).toBe(false);
    expect(result.errors).toContain("no disclosure choice selected");
  });

  it("fails on an unknown disclosure choice", () => {
    const draft = selectDisclosure(
      attachEvidence(selectClaimAnswer(createEmptyReportDraft(), "claim_suspect", "opt_nara"), "evidence_test"),
      "disclosure_missing",
    );
    const result = validateReportDraft(draft, bundleWithConclusion());
    expect(result.valid).toBe(false);
    expect(result.errors).toContain("disclosure choice 'disclosure_missing' does not exist in conclusion");
  });

  it("fails when the bundle has no conclusion", () => {
    const bundle = loadBundle();
    bundle.conclusions = [];
    const result = validateReportDraft(validDraft(), bundle);
    expect(result.valid).toBe(false);
    expect(result.errors).toContain("no conclusion defined for this case");
  });
});

describe("prepareSubmission", () => {
  it("returns invalid for an invalid draft", () => {
    const prepared = prepareSubmission(createEmptyReportDraft(), bundleWithConclusion());
    expect("kind" in prepared && prepared.kind).toBe("invalid");
  });

  it("builds the canonical report and flag effects for a correct claim", () => {
    const prepared = prepareSubmission(validDraft(), bundleWithConclusion());
    if ("kind" in prepared) throw new Error("expected valid submission");
    expect(prepared.report.claimAnswers).toEqual({ claim_suspect: "opt_nara" });
    expect(prepared.report.evidenceIds).toEqual(["evidence_test"]);
    expect(prepared.report.disclosureChoiceId).toBe("disclosure_open");
    expect(prepared.flagEffects).toContainEqual({ key: "claim_claim_suspect_correct", value: true });
    expect(prepared.flagEffects).toContainEqual({ key: "disclosure_recipient", value: "open_signal" });
    expect(prepared.flagEffects).toContainEqual({ key: "disclosure_redacts", value: false });
  });

  it("marks an incorrect claim as false", () => {
    const draft = selectDisclosure(
      attachEvidence(selectClaimAnswer(createEmptyReportDraft(), "claim_suspect", "opt_pelaga"), "evidence_test"),
      "disclosure_open",
    );
    const prepared = prepareSubmission(draft, bundleWithConclusion());
    if ("kind" in prepared) throw new Error("expected valid");
    expect(prepared.flagEffects).toContainEqual({ key: "claim_claim_suspect_correct", value: false });
  });

  it("emits redacts true and the mio recipient for the redacting disclosure", () => {
    const draft = selectDisclosure(
      attachEvidence(selectClaimAnswer(createEmptyReportDraft(), "claim_suspect", "opt_nara"), "evidence_test"),
      "disclosure_mio",
    );
    const prepared = prepareSubmission(draft, bundleWithConclusion());
    if ("kind" in prepared) throw new Error("expected valid");
    expect(prepared.flagEffects).toContainEqual({ key: "disclosure_recipient", value: "mio" });
    expect(prepared.flagEffects).toContainEqual({ key: "disclosure_redacts", value: true });
  });

  it("omits a flag for an unanswered optional claim", () => {
    const prepared = prepareSubmission(validDraft(), bundleWithConclusion());
    if ("kind" in prepared) throw new Error("expected valid");
    expect(prepared.flagEffects.some((effect) => effect.key === "claim_claim_optional_correct")).toBe(false);
  });
});
