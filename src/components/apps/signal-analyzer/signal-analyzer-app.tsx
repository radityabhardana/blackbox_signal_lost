"use client";

import { useMemo, useState } from "react";
import { useOptionalCaseSession } from "@/features/session/case-session";
import { assessSignalComparison } from "@/domain/signal-analyzer/evaluate";
import type { SignalComparisonAssessment } from "@/domain/signal-analyzer/types";
import type { SignalComparisonPuzzle } from "@/content/schemas";

const APP_ID = "app_signal_analyzer";
const INCORRECT_FEEDBACK =
  "The selected discrepancies do not match the event signature. Review the comparison and retry.";

export function SignalAnalyzerApp() {
  const session = useOptionalCaseSession();
  const [markedIds, setMarkedIds] = useState<ReadonlySet<string>>(() => new Set());
  const [result, setResult] = useState<SignalComparisonAssessment | null>(null);
  const [solved, setSolved] = useState(false);

  const puzzle = useMemo<SignalComparisonPuzzle | null>(() => {
    if (session === null) return null;
    return (
      session.content.puzzles.find(
        (candidate): candidate is SignalComparisonPuzzle => candidate.kind === "signal_comparison",
      ) ?? null
    );
  }, [session]);

  const unlocked = session !== null && session.state.unlockedApplications.includes(APP_ID);

  if (session === null || !unlocked) {
    return (
      <div className="p-6" role="region" aria-label="Signal Analyzer">
        <p className="font-mono text-xs uppercase tracking-widest text-bbx-text-2">
          Signal Analyzer unavailable
        </p>
      </div>
    );
  }

  if (puzzle === null) {
    return (
      <div className="p-6" role="region" aria-label="Signal Analyzer">
        <p className="font-mono text-xs uppercase tracking-widest text-bbx-text-2">
          No signal data available
        </p>
      </div>
    );
  }

  const toggle = (propertyId: string): void => {
    const next = new Set(markedIds);
    if (next.has(propertyId)) {
      next.delete(propertyId);
    } else {
      next.add(propertyId);
    }
    setMarkedIds(next);
  };

  const submit = (): void => {
    if (markedIds.size === 0 || solved) return;
    const assessment = assessSignalComparison(puzzle, { markedPropertyIds: [...markedIds] });
    setResult(assessment);
    if (assessment.verdict.kind === "correct") {
      setSolved(true);
      session.dispatch({ kind: "game_event", event: { type: "puzzle_completed", entityId: puzzle.id } });
    }
  };

  const conclusion =
    result !== null && result.verdict.kind === "correct" && result.conclusionText !== null
      ? `${result.conclusionText} Authenticity determination complete.`
      : null;

  return (
    <section role="region" aria-label="Signal Analyzer" className="flex h-full min-h-0 flex-col">
      <header className="px-4 pt-3 pb-2">
        <h2 className="font-mono text-xs uppercase tracking-widest text-bbx-text-1">Signal Analyzer</h2>
        <p className="font-mono text-[0.625rem] uppercase tracking-widest text-bbx-text-2">
          Comparing {puzzle.referenceLabel} vs {puzzle.disputedLabel}
        </p>
        <p className="text-sm text-bbx-text-1">{puzzle.title}</p>
      </header>
      <div className="min-h-0 flex-1 overflow-y-auto px-4 pb-2">
        <table className="w-full border-collapse text-left">
          <thead>
            <tr className="border-b border-bbx-surface-2">
              <th scope="col" className="py-2 pr-3 font-mono text-[0.625rem] uppercase tracking-widest text-bbx-text-2">
                Property
              </th>
              <th scope="col" className="py-2 pr-3 font-mono text-[0.625rem] uppercase tracking-widest text-bbx-text-2">
                {puzzle.referenceLabel}
              </th>
              <th scope="col" className="py-2 pr-3 font-mono text-[0.625rem] uppercase tracking-widest text-bbx-text-2">
                {puzzle.disputedLabel}
              </th>
              <th scope="col" className="py-2 font-mono text-[0.625rem] uppercase tracking-widest text-bbx-text-2">
                Discrepancy?
              </th>
            </tr>
          </thead>
          <tbody>
            {puzzle.properties.map((property) => {
              const marked = markedIds.has(property.id);
              return (
                <tr key={property.id} className="border-b border-bbx-surface-2">
                  <th scope="row" className="py-2 pr-3 text-left text-sm font-normal text-bbx-text-1">
                    {property.label}
                  </th>
                  <td className="py-2 pr-3 font-mono text-xs text-bbx-text-2">{property.referenceValue}</td>
                  <td className="py-2 pr-3 font-mono text-xs text-bbx-text-2">{property.disputedValue}</td>
                  <td className="py-2">
                    <button
                      type="button"
                      role="checkbox"
                      aria-checked={marked}
                      aria-label={`Mark ${property.label} as a discrepancy`}
                      className={`rounded-sm border border-bbx-surface-2 px-2 py-1 font-mono text-[0.625rem] uppercase tracking-widest text-bbx-text-2 hover:bg-bbx-surface-2 focus-visible:outline-1 focus-visible:outline-bbx-accent${
                        marked ? " border-l-2 border-bbx-accent-signal text-bbx-text-1" : ""
                      }`}
                      onClick={() => toggle(property.id)}
                    >
                      {marked ? "Marked" : "Mark"}
                    </button>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
      <footer className="flex items-center gap-3 px-4 py-3">
        <button
          type="button"
          className="bbx-btn bbx-btn-primary"
          disabled={markedIds.size === 0 || solved}
          onClick={submit}
        >
          Analyze
        </button>
        {result !== null ? (
          <div role="status" aria-live="polite" className="font-mono text-xs leading-5 text-bbx-text-2">
            {conclusion ?? INCORRECT_FEEDBACK}
          </div>
        ) : null}
      </footer>
    </section>
  );
}
