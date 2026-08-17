/**
 * BBX-081 — pure outcome selection.
 *
 * Filters outcomes whose evaluationRule evaluates true against the engine
 * state, sorts descending by priority (ties → declaration order), and returns
 * the winner. Purely selects — the winning outcome's effects are applied by
 * the runtime via the {kind:"outcome_selected"} engine input.
 */
import { evaluateRule } from "@/domain/rules";
import { toRuleEvaluationContext } from "@/domain/engine/rule-context";
import type { CaseEngineState } from "@/domain/engine";
import type { OutcomeDefinition } from "@/content/schemas";

export type OutcomeSelection =
  | { kind: "selected"; outcome: OutcomeDefinition }
  | { kind: "none" };

/**
 * Deterministically picks the matching outcome with the highest priority
 * (declaration order breaks ties). Returns {kind:"none"} when nothing matches.
 */
export function selectOutcome(
  outcomes: readonly OutcomeDefinition[],
  state: CaseEngineState,
): OutcomeSelection {
  const context = toRuleEvaluationContext(state);
  const matching = outcomes.filter((outcome) => evaluateRule(outcome.evaluationRule, context));
  const winner = matching
    .slice()
    .sort((a, b) => b.priority - a.priority)[0];
  return winner === undefined ? { kind: "none" } : { kind: "selected", outcome: winner };
}
