import type { RuleEvent } from "../rules";
import type { GameEffect } from "../../content/schemas";

/**
 * Deterministic case-engine state. Contains only directly
 * JSON.stringify-compatible values — no Set/Map. Unique-ID lists preserve
 * insertion order and never contain duplicates.
 */
export interface CaseEngineState {
  flags: Record<string, string | number | boolean>;
  eventHistory: readonly RuleEvent[];
  discoveredEntityIds: readonly string[];
  unlockedRecords: readonly string[];
  unlockedApplications: readonly string[];
  activeObjectives: readonly string[];
  completedObjectives: readonly string[];
  selectedChoices: readonly string[];
  firedTriggerIds: readonly string[];
  queuedDialogue: readonly string[];
  audioCues: readonly string[];
  notifications: readonly string[];
  /** Unique-ID list of revealed hint ids; player-requested hint history only — never read by rules */
  revealedHintIds: readonly string[];
  /** Immutable canonical submission snapshot (opaque JSON bag; typed shape lives in the conclusion schema). */
  submittedReport: Record<string, unknown> | null;
  /** Selected outcome id once the outcome evaluator runs; null before submission. */
  selectedOutcomeId: string | null;
  /** True once a case-ending outcome has been delivered. */
  caseCompleted: boolean;
}

/**
 * Engine input contract. This is BBX-022's own typed input model, explicitly
 * not the persisted SaveGame/GameEvent taxonomy (docs/09 keeps GameEvent
 * opaque). Each input projects to exactly one RuleEvent.
 */
export type EngineInput =
  | { kind: "game_event"; event: RuleEvent }
  | { kind: "evidence_discovered"; evidenceId: string }
  | { kind: "dialogue_choice_selected"; choiceId: string }
  | { kind: "hint_revealed"; hintId: string }
  | { kind: "report_submitted"; report: Record<string, unknown>; flagEffects: readonly ReportFlagEffect[] }
  | { kind: "outcome_selected"; outcomeId: string | null }
  | { kind: "checkpoint_requested" }
  | { kind: "checkpoint_restore_requested" };

/** A single set_flag effect carried by a report submission (BBX-081). */
export interface ReportFlagEffect {
  readonly key: string;
  readonly value: string | number | boolean;
}

export interface EngineResult {
  state: CaseEngineState;
  appliedEffects: readonly GameEffect[];
}
