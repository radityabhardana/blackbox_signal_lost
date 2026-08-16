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
  | { kind: "hint_revealed"; hintId: string };

export interface EngineResult {
  state: CaseEngineState;
  appliedEffects: readonly GameEffect[];
}
