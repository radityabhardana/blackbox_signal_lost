/**
 * BBX-081 — report validation and canonical submission preparation.
 *
 * Pure: validates a ReportDraft against the case's conclusion definition,
 * then builds the canonical SubmittedReportShape plus the set_flag effects
 * that the engine applies during the report_submitted input step.
 *
 * Two-step pipeline (documented contract):
 *   1. prepareSubmission(draft, content) → flagEffects + report
 *   2. dispatch {kind:"report_submitted", report, flagEffects}
 *   3. selectOutcome(stateAfter) → selected outcome
 *   4. dispatch {kind:"outcome_selected", outcomeId}
 */
import type { ContentBundle } from "@/content/validator";
import type { ReportDraft } from "./report-draft";

export interface SubmittedReportShape {
  readonly claimAnswers: Readonly<Record<string, string>>;
  readonly evidenceIds: readonly string[];
  readonly disclosureChoiceId: string;
}

export interface ReportValidationResult {
  readonly valid: boolean;
  readonly errors: readonly string[];
}

export interface ReportFlagEffect {
  readonly key: string;
  readonly value: string | number | boolean;
}

export interface PreparedSubmission {
  readonly report: SubmittedReportShape;
  readonly flagEffects: readonly ReportFlagEffect[];
}

/**
 * Validates a draft against the case's conclusion definition (content.conclusions[0]).
 * Returns a human-readable error list; empty errors means valid.
 */
export function validateReportDraft(draft: ReportDraft, content: ContentBundle): ReportValidationResult {
  const errors: string[] = [];
  const conclusion = content.conclusions[0];
  if (!conclusion) {
    return { valid: false, errors: ["no conclusion defined for this case"] };
  }

  // 1. Every non-optional claim has an answer whose option id exists.
  for (const slot of conclusion.claimSlots) {
    const answer = draft.claimAnswers[slot.id];
    const optionIds = new Set(slot.answerOptions.map((option) => option.id));
    if (answer === undefined) {
      if (!slot.optional) {
        errors.push(`claim '${slot.id}' requires an answer`);
      }
      continue;
    }
    if (!optionIds.has(answer)) {
      errors.push(`claim '${slot.id}' has answer '${answer}' which is not a valid option`);
    }
  }

  // 2. Evidence count ≥ evidenceSlotCount
  if (draft.evidenceIds.length < conclusion.evidenceSlotCount) {
    errors.push(
      `report requires at least ${conclusion.evidenceSlotCount} evidence items (got ${draft.evidenceIds.length})`,
    );
  }

  // 3. No duplicate evidence ids
  const seen = new Set<string>();
  for (const id of draft.evidenceIds) {
    if (seen.has(id)) {
      errors.push(`duplicate evidence id '${id}'`);
    }
    seen.add(id);
  }

  // 4. Every evidence id resolves in content.evidence
  const evidenceIds = new Set(content.evidence.map((evidence) => evidence.id));
  for (const id of draft.evidenceIds) {
    if (!evidenceIds.has(id)) {
      errors.push(`evidence id '${id}' does not exist in case content`);
    }
  }

  // 5. Disclosure choice resolves
  if (draft.disclosureChoiceId === null) {
    errors.push("no disclosure choice selected");
  } else if (
    !conclusion.disclosureChoices.some((choice) => choice.id === draft.disclosureChoiceId)
  ) {
    errors.push(`disclosure choice '${draft.disclosureChoiceId}' does not exist in conclusion`);
  }

  return { valid: errors.length === 0, errors };
}

/**
 * Validates the draft and, if valid, builds the canonical report + flag effects.
 * Flag effects encode claim correctness and disclosure choice, which the engine
 * applies as set_flag effects during the report_submitted engine step.
 */
export function prepareSubmission(
  draft: ReportDraft,
  content: ContentBundle,
): PreparedSubmission | { kind: "invalid"; errors: readonly string[] } {
  const validation = validateReportDraft(draft, content);
  if (!validation.valid) {
    return { kind: "invalid", errors: validation.errors };
  }

  const conclusion = content.conclusions[0];
  if (!conclusion) {
    return { kind: "invalid", errors: ["no conclusion defined for this case"] };
  }

  const flagEffects: ReportFlagEffect[] = [];

  // Claim correctness flags: one per answered claim (optional unanswered claims emit none).
  for (const slot of conclusion.claimSlots) {
    const answer = draft.claimAnswers[slot.id];
    if (answer === undefined) continue;
    const selected = slot.answerOptions.find((option) => option.id === answer);
    const correct = selected?.correct === true;
    flagEffects.push({ key: `claim_${slot.id}_correct`, value: correct });
  }

  // Disclosure flags from the selected choice.
  const disclosure = conclusion.disclosureChoices.find(
    (choice) => choice.id === draft.disclosureChoiceId,
  );
  if (disclosure) {
    flagEffects.push({ key: "disclosure_recipient", value: disclosure.recipient });
    flagEffects.push({ key: "disclosure_redacts", value: disclosure.redactsLocation });
  }

  return {
    report: {
      claimAnswers: { ...draft.claimAnswers },
      evidenceIds: [...draft.evidenceIds],
      // Validated non-null above.
      disclosureChoiceId: draft.disclosureChoiceId as string,
    },
    flagEffects,
  };
}