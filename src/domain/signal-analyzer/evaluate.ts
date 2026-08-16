import type { SignalComparisonPuzzle } from "@/content/schemas";
import type { SignalComparisonAssessment, SignalComparisonSelection } from "./types";

/**
 * Determines whether a player's marked discrepancies exactly match the
 * authored decisive properties of a signal-comparison puzzle.
 *
 * Pure and deterministic: reads only `puzzle.properties` (decisive flags) and
 * `selection.markedPropertyIds`. The decisive set is authored puzzle truth and
 * is never rendered by the UI — only this evaluator reads it.
 */
export function assessSignalComparison(
  puzzle: SignalComparisonPuzzle,
  selection: SignalComparisonSelection,
): SignalComparisonAssessment {
  const decisiveIds = puzzle.properties.filter((property) => property.decisive).map((property) => property.id);
  const decisive = new Set(decisiveIds);
  const marked = new Set(selection.markedPropertyIds);

  // Empty selections and unknown ids are not special: any mismatch is a plain
  // incorrect verdict. "no_submission" is a UI-state concept, not an evaluator result.
  const missingDecisiveIds = decisiveIds.filter((id) => !marked.has(id));
  const extraMarkedIds = [...marked].filter((id) => !decisive.has(id));

  if (missingDecisiveIds.length === 0 && extraMarkedIds.length === 0) {
    return Object.freeze({
      verdict: Object.freeze({ kind: "correct" } as const),
      conclusionText: puzzle.conclusionText,
    });
  }

  return Object.freeze({
    verdict: Object.freeze({
      kind: "incorrect" as const,
      missingDecisiveIds,
      extraMarkedIds,
    }),
    conclusionText: null,
  });
}