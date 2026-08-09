import type { RuleExpression } from "../../content/schemas";
import type { RuleEvaluationContext } from "./types";

const OPERATOR_KEYS: ReadonlyArray<keyof RuleExpression> = [
  "always",
  "all",
  "any",
  "not",
  "flagEquals",
  "eventOccurred",
  "entityDiscovered",
  "objectiveCompleted",
  "choiceSelected",
  "countAtLeast",
];

/** Raised only for impossible/malformed expression shapes that should never
 * reach the evaluator after BBX-020 structural validation. */
export class RuleEvaluatorError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "RuleEvaluatorError";
  }
}

function unreachable(message: string): never {
  throw new RuleEvaluatorError(message);
}

/**
 * Deterministic, pure, side-effect-free evaluation of a validated
 * RuleExpression against a runtime context.
 *
 * Missing runtime state is not malformed content and always evaluates false
 * (missing flag, absent membership, no matching event). An expression that
 * does not contain exactly one documented operator is a programming/schema
 * integration defect and throws RuleEvaluatorError instead of silently
 * returning false.
 */
export function evaluateRule(expression: RuleExpression, context: RuleEvaluationContext): boolean {
  const present = OPERATOR_KEYS.filter((key) => expression[key] !== undefined);
  if (present.length !== 1) {
    return unreachable(
      `rule expression must contain exactly one operator (found ${present.length})`,
    );
  }

  switch (present[0]) {
    case "always":
      return true;
    case "all":
      return (expression.all ?? []).every((child) => evaluateRule(child, context));
    case "any":
      return (expression.any ?? []).some((child) => evaluateRule(child, context));
    case "not":
      return !evaluateRule(expression.not!, context);
    case "flagEquals": {
      const flagEquals = expression.flagEquals!;
      return context.flags[flagEquals.key] === flagEquals.value;
    }
    case "eventOccurred": {
      const eventOccurred = expression.eventOccurred!;
      return context.events.some(
        (event) =>
          event.type === eventOccurred.type &&
          (eventOccurred.entityId === undefined || event.entityId === eventOccurred.entityId),
      );
    }
    case "entityDiscovered":
      return context.discoveredEntities.has(expression.entityDiscovered!);
    case "objectiveCompleted":
      return context.completedObjectives.has(expression.objectiveCompleted!);
    case "choiceSelected":
      return context.selectedChoices.has(expression.choiceSelected!);
    case "countAtLeast": {
      const countAtLeast = expression.countAtLeast!;
      const matchingCount = context.events.reduce(
        (total, event) => total + (event.type === countAtLeast.eventType ? 1 : 0),
        0,
      );
      return matchingCount >= countAtLeast.count;
    }
    default:
      return unreachable(`unhandled rule operator`);
  }
}
