/** Player selection: the set of property ids marked as discrepancies. */
export interface SignalComparisonSelection {
  readonly markedPropertyIds: readonly string[];
}

export type SignalComparisonVerdict =
  | { kind: "correct" }
  | {
      readonly kind: "incorrect";
      readonly missingDecisiveIds: readonly string[];
      readonly extraMarkedIds: readonly string[];
    }
  | { kind: "no_submission" };

export interface SignalComparisonAssessment {
  readonly verdict: SignalComparisonVerdict;
  /** Authored conclusion text — provided ONLY on correct verdicts. */
  readonly conclusionText: string | null;
}

/** App-layer dispatch contract (Lane C): marks a puzzle as completed by the player. */
export interface PuzzleCompletionInput {
  readonly kind: "game_event";
  readonly event: { readonly type: "puzzle_completed"; readonly entityId: string };
}
