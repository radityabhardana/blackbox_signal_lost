import type { RuleEvaluationContext } from "../rules";
import type { CaseEngineState } from "./types";

/**
 * Single public projection from deterministic engine state to the
 * evaluator-facing rule context. BBX-041: the engine's step delegates to this
 * exact helper, so trigger rules and search availability gates always read
 * the same truth.
 */
export function toRuleEvaluationContext(
  state: CaseEngineState,
): RuleEvaluationContext {
  return {
    flags: state.flags,
    events: state.eventHistory,
    discoveredEntities: new Set(state.discoveredEntityIds),
    completedObjectives: new Set(state.completedObjectives),
    selectedChoices: new Set(state.selectedChoices),
  };
}
