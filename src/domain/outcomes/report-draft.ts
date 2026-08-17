/**
 * BBX-081 — the player's in-progress conclusion report draft.
 *
 * Pure immutable draft domain: every transition returns a fresh frozen draft
 * and never mutates its input. Validation lives in report-submission.ts; this
 * module only models selection state.
 */
export interface ReportDraft {
  /** claimId -> selected answerOptionId */
  readonly claimAnswers: Readonly<Record<string, string>>;
  readonly evidenceIds: readonly string[];
  readonly disclosureChoiceId: string | null;
}

export function createEmptyReportDraft(): ReportDraft {
  return freezeDraft({ claimAnswers: {}, evidenceIds: [], disclosureChoiceId: null });
}

/** Selects (or replaces) the answer for a claim. */
export function selectClaimAnswer(draft: ReportDraft, claimId: string, answerOptionId: string): ReportDraft {
  return freezeDraft({
    claimAnswers: { ...draft.claimAnswers, [claimId]: answerOptionId },
    evidenceIds: [...draft.evidenceIds],
    disclosureChoiceId: draft.disclosureChoiceId,
  });
}

/** Removes the answer for a claim; no-op when the claim has no answer. */
export function clearClaimAnswer(draft: ReportDraft, claimId: string): ReportDraft {
  if (!(claimId in draft.claimAnswers)) return draft;
  const claimAnswers = { ...draft.claimAnswers };
  delete claimAnswers[claimId];
  return freezeDraft({
    claimAnswers,
    evidenceIds: [...draft.evidenceIds],
    disclosureChoiceId: draft.disclosureChoiceId,
  });
}

/** Attaches an evidence id; no-op when already attached. */
export function attachEvidence(draft: ReportDraft, evidenceId: string): ReportDraft {
  if (draft.evidenceIds.includes(evidenceId)) return draft;
  return freezeDraft({
    claimAnswers: { ...draft.claimAnswers },
    evidenceIds: [...draft.evidenceIds, evidenceId],
    disclosureChoiceId: draft.disclosureChoiceId,
  });
}

/** Removes an evidence id; no-op when not attached. */
export function removeEvidence(draft: ReportDraft, evidenceId: string): ReportDraft {
  if (!draft.evidenceIds.includes(evidenceId)) return draft;
  return freezeDraft({
    claimAnswers: { ...draft.claimAnswers },
    evidenceIds: draft.evidenceIds.filter((id) => id !== evidenceId),
    disclosureChoiceId: draft.disclosureChoiceId,
  });
}

/** Selects the disclosure choice. */
export function selectDisclosure(draft: ReportDraft, disclosureChoiceId: string): ReportDraft {
  return freezeDraft({
    claimAnswers: { ...draft.claimAnswers },
    evidenceIds: [...draft.evidenceIds],
    disclosureChoiceId,
  });
}

function freezeDraft(draft: ReportDraft): ReportDraft {
  Object.freeze(draft.claimAnswers);
  Object.freeze(draft.evidenceIds);
  return Object.freeze(draft);
}
