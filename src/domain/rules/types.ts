export interface RuleEvent {
  readonly type: string;
  readonly entityId?: string;
}

/**
 * Minimal runtime data the RuleExpression operators read. This is the
 * evaluator-facing projection only: flags, event history, and the three
 * membership sets. No timestamps, save data, manifest, UI, or engine state.
 */
export interface RuleEvaluationContext {
  readonly flags: Readonly<Record<string, string | number | boolean>>;
  readonly events: readonly RuleEvent[];
  readonly discoveredEntities: ReadonlySet<string>;
  readonly completedObjectives: ReadonlySet<string>;
  readonly selectedChoices: ReadonlySet<string>;
}
