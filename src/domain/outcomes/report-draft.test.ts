import { describe, expect, it } from "vitest";
import {
  attachEvidence,
  clearClaimAnswer,
  createEmptyReportDraft,
  removeEvidence,
  selectClaimAnswer,
  selectDisclosure,
} from "./report-draft";

describe("report draft transitions", () => {
  it("creates an empty draft", () => {
    const draft = createEmptyReportDraft();
    expect(draft.claimAnswers).toEqual({});
    expect(draft.evidenceIds).toEqual([]);
    expect(draft.disclosureChoiceId).toBeNull();
  });

  it("selectClaimAnswer adds and replaces an answer immutably", () => {
    const empty = createEmptyReportDraft();
    const withAnswer = selectClaimAnswer(empty, "claim_a", "opt_1");
    expect(withAnswer.claimAnswers).toEqual({ claim_a: "opt_1" });
    expect(empty.claimAnswers).toEqual({});

    const replaced = selectClaimAnswer(withAnswer, "claim_a", "opt_2");
    expect(replaced.claimAnswers).toEqual({ claim_a: "opt_2" });
    expect(withAnswer.claimAnswers).toEqual({ claim_a: "opt_1" });
  });

  it("clearClaimAnswer removes an answer and is a no-op when absent", () => {
    const withAnswer = selectClaimAnswer(createEmptyReportDraft(), "claim_a", "opt_1");
    const cleared = clearClaimAnswer(withAnswer, "claim_a");
    expect(cleared.claimAnswers).toEqual({});
    expect(withAnswer.claimAnswers).toEqual({ claim_a: "opt_1" });

    const noOp = clearClaimAnswer(cleared, "claim_missing");
    expect(noOp).toBe(cleared);
  });

  it("attachEvidence appends uniquely and is a no-op when present", () => {
    const empty = createEmptyReportDraft();
    const attached = attachEvidence(empty, "evidence_a");
    expect(attached.evidenceIds).toEqual(["evidence_a"]);
    expect(empty.evidenceIds).toEqual([]);

    const duplicate = attachEvidence(attached, "evidence_a");
    expect(duplicate).toBe(attached);
    expect(duplicate.evidenceIds).toEqual(["evidence_a"]);
  });

  it("removeEvidence removes an id and is a no-op when absent", () => {
    const attached = attachEvidence(createEmptyReportDraft(), "evidence_a");
    const removed = removeEvidence(attached, "evidence_a");
    expect(removed.evidenceIds).toEqual([]);
    expect(attached.evidenceIds).toEqual(["evidence_a"]);

    const noOp = removeEvidence(removed, "evidence_missing");
    expect(noOp).toBe(removed);
  });

  it("selectDisclosure sets the disclosure choice immutably", () => {
    const empty = createEmptyReportDraft();
    const selected = selectDisclosure(empty, "disclosure_open");
    expect(selected.disclosureChoiceId).toBe("disclosure_open");
    expect(empty.disclosureChoiceId).toBeNull();
  });

  it("produces frozen outputs", () => {
    const draft = selectDisclosure(
      attachEvidence(selectClaimAnswer(createEmptyReportDraft(), "claim_a", "opt_1"), "evidence_a"),
      "disclosure_open",
    );
    expect(Object.isFrozen(draft)).toBe(true);
    expect(Object.isFrozen(draft.claimAnswers)).toBe(true);
    expect(Object.isFrozen(draft.evidenceIds)).toBe(true);
  });
});
