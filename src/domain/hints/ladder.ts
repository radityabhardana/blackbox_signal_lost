import type { HintDefinition } from "@/content/schemas";

// docs/03 §5.9 — escalating hint strength labels, one per tier.
export type HintTierLabel = "Refocus" | "Direction" | "Connection" | "Answer path";
export const HINT_TIER_LABELS: Record<1 | 2 | 3 | 4, HintTierLabel> = {
  1: "Refocus",
  2: "Direction",
  3: "Connection",
  4: "Answer path",
};

export interface HintLadderState {
  readonly objectiveId: string;
  /** Revealed hints for this objective, in authored order (by tier). */
  readonly revealed: readonly HintDefinition[];
  /** The next hint to reveal, or null when all authored hints are revealed. */
  readonly next: HintDefinition | null;
  /** Strength label of the next hint (docs/03 §5.9), or null when exhausted. */
  readonly nextLabel: HintTierLabel | null;
  readonly allRevealed: boolean;
  /** No authored hints exist for this objective. */
  readonly hasNoHints: boolean;
}

export interface BuildHintLadderInput {
  readonly objectiveId: string;
  readonly objectiveHintIds: readonly string[];
  readonly allHints: readonly HintDefinition[];
  readonly revealedHintIds: readonly string[];
}

/**
 * Pure projection of one objective's hint ladder from authored content plus
 * recorded reveal history. Deterministic: objective hints are filtered to the
 * objective's own authored ids, sorted by tier ascending (authored order on
 * ties), and the reveal history is projected in that same order. Unknown or
 * duplicate ids are skipped defensively (no throw). All returned objects and
 * arrays are frozen.
 */
export function buildHintLadder(input: BuildHintLadderInput): HintLadderState {
  const objectiveHints = input.allHints
    .filter(
      (hint) =>
        hint.objectiveId === input.objectiveId && input.objectiveHintIds.includes(hint.id),
    )
    .sort((a, b) => a.tier - b.tier);

  const revealed = objectiveHints.filter((hint) => input.revealedHintIds.includes(hint.id));
  const next = objectiveHints.find((hint) => !input.revealedHintIds.includes(hint.id)) ?? null;

  return Object.freeze({
    objectiveId: input.objectiveId,
    revealed: Object.freeze(revealed),
    next,
    nextLabel: next === null ? null : HINT_TIER_LABELS[next.tier],
    allRevealed: revealed.length === objectiveHints.length,
    hasNoHints: objectiveHints.length === 0,
  });
}
