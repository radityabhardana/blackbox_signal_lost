"use client";

import { useState } from "react";
import { useOptionalCaseSession } from "@/features/session/case-session";
import {
  createEmptyReportDraft,
  selectClaimAnswer,
  selectDisclosure,
} from "@/domain/outcomes/report-draft";
import type { ReportDraft } from "@/domain/outcomes/report-draft";
import { prepareSubmission, validateReportDraft } from "@/domain/outcomes/report-submission";
import { selectOutcome } from "@/domain/outcomes/evaluate-outcomes";
import type {
  ConclusionDefinition,
  EndingDefinition,
  EvidenceDefinition,
  OutcomeDefinition,
} from "@/content/schemas";
import type { ContentBundle } from "@/content/validator";

const APP_ID = "app_conclusion";
const REQUIRED_LINE = "Submission changes the case and cannot be undone from this report.";

type View = "form" | "review" | "outcome";

/** The authored ending body is an opaque {sections: string[]} shape; render defensively. */
function endingSections(body: Record<string, unknown>): readonly string[] {
  const raw = body.sections;
  if (!Array.isArray(raw)) return [];
  return raw.filter((item): item is string => typeof item === "string");
}

interface EvidenceMap {
  readonly byId: ReadonlyMap<string, EvidenceDefinition>;
  readonly discovered: readonly EvidenceDefinition[];
}

export function ConclusionReportApp() {
  const session = useOptionalCaseSession();
  const [draft, setDraft] = useState<ReportDraft>(createEmptyReportDraft);
  const [view, setView] = useState<View>("form");
  const [submitted, setSubmitted] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);

  const unlocked = session !== null && session.state.unlockedApplications.includes(APP_ID);

  if (session === null || !unlocked) {
    return (
      <div className="p-6" role="region" aria-label="Conclusion Report">
        <p className="font-mono text-xs uppercase tracking-widest text-bbx-text-2">
          Conclusion Report unavailable
        </p>
      </div>
    );
  }

  // Non-null capture: nested function declarations below do not retain the
  // guard's narrowing, so bind the active session once for their closures.
  const activeSession = session;

  const conclusion: ConclusionDefinition | undefined = activeSession.content.conclusions[0];
  const showOutcome =
    submitted || activeSession.state.caseCompleted || activeSession.state.selectedOutcomeId !== null;

  if (showOutcome) {
    return renderOutcome(
      activeSession.content.case.outcomes,
      activeSession.content.endings,
      activeSession.state.selectedOutcomeId,
      retry,
    );
  }

  if (conclusion === undefined || conclusion.claimSlots.length === 0) {
    return (
      <div className="p-6" role="region" aria-label="Conclusion Report">
        <p className="font-mono text-xs uppercase tracking-widest text-bbx-text-2">No report available</p>
      </div>
    );
  }

  const byId = new Map(
    activeSession.content.evidence.map((item): [string, EvidenceDefinition] => [item.id, item]),
  );
  const evidence: EvidenceMap = {
    byId,
    discovered: activeSession.state.discoveredEntityIds
      .map((id) => byId.get(id))
      .filter((item): item is EvidenceDefinition => item !== undefined),
  };

  if (view === "review") {
    return renderReview(conclusion, evidence.byId, draft, submitError, goBack, submitReport);
  }

  return renderForm(conclusion, evidence, draft, goToReview, activeSession.content, handleDraftChange, handleEvidenceChange);

  function handleDraftChange(next: ReportDraft): void {
    setDraft(next);
  }

  function handleEvidenceChange(current: ReportDraft, index: number, evidenceId: string): void {
    if (evidenceId === "") return;
    // Slot semantics: replace the evidence at `index` without duplicating.
    const others = current.evidenceIds.filter((id, i) => i !== index && id !== evidenceId);
    setDraft({
      ...current,
      evidenceIds: [...others.slice(0, index), evidenceId, ...others.slice(index)],
    });
  }

  function goToReview(): void {
    const validation = validateReportDraft(draft, activeSession.content);
    if (!validation.valid) return;
    setSubmitError(null);
    setView("review");
  }

  function goBack(): void {
    setView("form");
  }

  function submitReport(): void {
    const prepared = prepareSubmission(draft, activeSession.content);
    if ("kind" in prepared) {
      setSubmitError(prepared.errors[0] ?? "Report is incomplete.");
      return;
    }
    // BBX-082: pre-submission checkpoint, then the two-step submission pipeline.
    activeSession.dispatch({ kind: "checkpoint_requested" });
    const report: Record<string, unknown> = {
      claimAnswers: { ...prepared.report.claimAnswers },
      evidenceIds: [...prepared.report.evidenceIds],
      disclosureChoiceId: prepared.report.disclosureChoiceId,
    };
    const afterReport = activeSession.dispatch({ kind: "report_submitted", report, flagEffects: prepared.flagEffects });
    const selection = selectOutcome(activeSession.content.case.outcomes, afterReport.state);
    activeSession.dispatch({
      kind: "outcome_selected",
      outcomeId: selection.kind === "selected" ? selection.outcome.id : null,
    });
    setSubmitted(true);
  }

  function retry(): void {
    // Lane C: the runtime remounts the session from the checkpoint; the
    // outcome state clears there. Locally, return to a fresh form.
    activeSession.dispatch({ kind: "checkpoint_restore_requested" });
    setSubmitted(false);
    setView("form");
    setDraft(createEmptyReportDraft());
  }
}

function renderForm(
  conclusion: ConclusionDefinition,
  evidence: EvidenceMap,
  draft: ReportDraft,
  goToReview: () => void,
  content: ContentBundle,
  onDraftChange: (next: ReportDraft) => void,
  onEvidenceChange: (draft: ReportDraft, index: number, evidenceId: string) => void,
) {
  const validation = validateReportDraft(draft, content);
  return <section role="region" aria-label="Conclusion Report" className="flex h-full min-h-0 flex-col">
    <header className="px-4 pt-3 pb-2">
      <h2 className="font-mono text-xs uppercase tracking-widest text-bbx-text-1">Conclusion Report</h2>
      <p className="text-sm text-bbx-text-1">Final report for the active case</p>
    </header>
    <div className="min-h-0 flex-1 space-y-4 overflow-y-auto px-4 pb-2">
      <section aria-label="Claims" className="space-y-3">
        {conclusion.claimSlots.map((claim) => (
          <fieldset key={claim.id} className="border border-bbx-surface-2 bg-bbx-surface-1 px-3 py-2">
            <legend className="px-1 font-mono text-[0.625rem] uppercase tracking-widest text-bbx-text-1">
              {claim.prompt}
            </legend>
            <div className="mt-1 space-y-1">
              {claim.answerOptions.map((option) => (
                <label key={option.id} className="flex items-center gap-2 text-sm text-bbx-text-1">
                  <input
                    type="radio"
                    name={claim.id}
                    value={option.id}
                    checked={draft.claimAnswers[claim.id] === option.id}
                    onChange={() => onDraftChange(selectClaimAnswer(draft, claim.id, option.id))}
                  />
                  {option.label}
                </label>
              ))}
            </div>
          </fieldset>
        ))}
      </section>
      <section aria-label="Evidence" className="border border-bbx-surface-2 bg-bbx-surface-1 px-3 py-2">
        <h3 className="font-mono text-[0.625rem] uppercase tracking-widest text-bbx-text-1">Evidence</h3>
        <div className="mt-1 space-y-1">
          {Array.from({ length: conclusion.evidenceSlotCount }).map((_, index) => (
            <select
              key={index}
              aria-label={`Evidence slot ${index + 1}`}
              value={draft.evidenceIds[index] ?? ""}
              onChange={(event) => onEvidenceChange(draft, index, event.target.value)}
              className="min-w-0 w-full border border-bbx-surface-2 bg-bbx-bg-0 px-2 py-1 text-sm text-bbx-text-1"
            >
              <option value="">Select evidence...</option>
              {evidence.discovered.map((item) => (
                <option key={item.id} value={item.id}>{item.title}</option>
              ))}
            </select>
          ))}
          <p className="font-mono text-[0.625rem] uppercase tracking-widest text-bbx-text-2">
            {draft.evidenceIds.length} of {conclusion.evidenceSlotCount} evidence attached
          </p>
        </div>
      </section>
      <section aria-label="Disclosure" className="border border-bbx-surface-2 bg-bbx-surface-1 px-3 py-2">
        <h3 className="font-mono text-[0.625rem] uppercase tracking-widest text-bbx-text-1">Disclosure</h3>
        <div className="mt-1 space-y-1">
          {conclusion.disclosureChoices.map((choice) => (
            <label key={choice.id} className="flex items-center gap-2 text-sm text-bbx-text-1">
              <input
                type="radio"
                name="disclosure"
                value={choice.id}
                checked={draft.disclosureChoiceId === choice.id}
                onChange={() => onDraftChange(selectDisclosure(draft, choice.id))}
              />
              {choice.label}
            </label>
          ))}
        </div>
      </section>
      <p className="font-mono text-[0.625rem] leading-4 text-bbx-text-2">{REQUIRED_LINE}</p>
    </div>
    <footer className="flex items-center gap-3 px-4 py-3">
      <button type="button" className="bbx-btn bbx-btn-primary" disabled={!validation.valid} onClick={goToReview}>
        Review Report
      </button>
      {!validation.valid ? (
        <p role="status" className="font-mono text-xs leading-5 text-bbx-text-2">{formWarning()}</p>
      ) : null}
    </footer>
  </section>;

  function formWarning(): string {
    if (draft.evidenceIds.length < conclusion.evidenceSlotCount) {
      return `Attach at least ${conclusion.evidenceSlotCount} pieces of evidence.`;
    }
    return validation.errors[0] ?? "Report is incomplete.";
  }
}

function renderReview(
  conclusion: ConclusionDefinition,
  evidenceById: ReadonlyMap<string, EvidenceDefinition>,
  draft: ReportDraft,
  submitError: string | null,
  goBack: () => void,
  submitReport: () => void,
) {
  return <section role="region" aria-label="Conclusion Report" className="flex h-full min-h-0 flex-col">
    <header className="px-4 pt-3 pb-2">
      <h2 className="font-mono text-xs uppercase tracking-widest text-bbx-text-1">Review Report</h2>
      <p className="font-mono text-[0.625rem] uppercase tracking-widest text-bbx-text-2">
        Review the report before final submission. Submission changes the case.
      </p>
    </header>
    <div className="min-h-0 flex-1 space-y-3 overflow-y-auto px-4 pb-2">
      {conclusion.claimSlots.map((claim) => {
        const answerId = draft.claimAnswers[claim.id];
        const option = claim.answerOptions.find((candidate) => candidate.id === answerId);
        return (
          <div key={claim.id}>
            <p className="font-mono text-[0.625rem] uppercase tracking-widest text-bbx-text-2">{claim.prompt}</p>
            <p className="text-sm text-bbx-text-1">{option?.label ?? "No answer"}</p>
          </div>
        );
      })}
      <div>
        <p className="font-mono text-[0.625rem] uppercase tracking-widest text-bbx-text-2">Evidence</p>
        <ul className="list-disc pl-5 text-sm text-bbx-text-1">
          {draft.evidenceIds.map((id) => (
            <li key={id}>{evidenceById.get(id)?.title ?? id}</li>
          ))}
        </ul>
      </div>
      <div>
        <p className="font-mono text-[0.625rem] uppercase tracking-widest text-bbx-text-2">Disclosure</p>
        <p className="text-sm text-bbx-text-1">
          {conclusion.disclosureChoices.find((choice) => choice.id === draft.disclosureChoiceId)?.label ?? "No disclosure"}
        </p>
      </div>
      {submitError !== null ? (
        <p role="status" className="font-mono text-xs leading-5 text-bbx-text-2">{submitError}</p>
      ) : null}
    </div>
    <footer className="flex items-center gap-3 px-4 py-3">
      <button type="button" className="bbx-btn" onClick={goBack}>Back</button>
      <button type="button" className="bbx-btn bbx-btn-primary" onClick={submitReport}>Submit Report</button>
    </footer>
  </section>;
}

function renderOutcome(
  outcomes: readonly OutcomeDefinition[],
  endings: readonly EndingDefinition[],
  selectedOutcomeId: string | null,
  retry: () => void,
) {
  const outcome = outcomes.find((candidate) => candidate.id === selectedOutcomeId) ?? null;
  const ending = outcome === null ? null : endings.find((candidate) => candidate.id === outcome.endingContentId) ?? null;
  return <section role="region" aria-label="Conclusion Report" className="flex h-full min-h-0 flex-col">
    <header className="px-4 pt-3 pb-2">
      <h2 className="font-mono text-xs uppercase tracking-widest text-bbx-text-1">Case Concluded</h2>
    </header>
    <div className="min-h-0 flex-1 space-y-3 overflow-y-auto px-4 pb-2">
      {ending === null ? (
        <p className="font-mono text-xs uppercase tracking-widest text-bbx-text-2">Case concluded</p>
      ) : (
        <article className={ending.isHiddenMeta ? "opacity-70" : undefined}>
          <h3 className="text-sm text-bbx-text-1">{ending.title}</h3>
          {endingSections(ending.body).map((section, index) => (
            <p key={index} className="mt-2 text-xs leading-5 text-bbx-text-1">{section}</p>
          ))}
        </article>
      )}
    </div>
    <footer className="px-4 py-3">
      <button type="button" className="bbx-btn" onClick={retry}>Retry Investigation</button>
    </footer>
  </section>;
}
