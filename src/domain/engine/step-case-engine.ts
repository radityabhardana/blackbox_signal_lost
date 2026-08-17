import { evaluateRule } from "../rules";
import { toRuleEvaluationContext } from "./rule-context";
import type { RuleEvent } from "../rules";
import type { CaseEngineState, EngineInput, EngineResult } from "./types";
import type { ContentBundle } from "../../content/validator";
import type { GameEffect, DialogueChoice } from "../../content/schemas";

/** Raised only for runtime integration defects (unknown referenced targets). */
export class EngineError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "EngineError";
  }
}

interface ContentIndexes {
  recordIds: ReadonlySet<string>;
  dialogueNodeIds: ReadonlySet<string>;
  objectiveIds: ReadonlySet<string>;
  evidenceIds: ReadonlySet<string>;
  assetIds: ReadonlySet<string>;
}

/**
 * Performs one deterministic engine step for a single input:
 *   append input event -> mirror input state -> apply choice consequences
 *   -> evaluate eligible triggers (highest priority first, declaration-order
 *   ties) -> apply their effects sequentially. No fixed-point re-evaluation.
 *
 * Pure: never mutates state, input, or content; returns a fresh state plus
 * the full ordered execution trace.
 */
export function stepCaseEngine(
  state: CaseEngineState,
  input: EngineInput,
  content: ContentBundle,
): EngineResult {
  const next = cloneState(state);
  const applied: GameEffect[] = [];

  next.eventHistory.push(toRuleEvent(input));

  if (input.kind === "evidence_discovered") {
    addUnique(next.discoveredEntityIds, input.evidenceId);
  }

  if (input.kind === "dialogue_choice_selected") {
    addUnique(next.selectedChoices, input.choiceId);
    const choice = resolveChoice(input.choiceId, content);
    if (!choice) {
      throw new EngineError(`unknown dialogue choice '${input.choiceId}'`);
    }
    for (const effect of choice.consequences) {
      applyEffect(next, effect, content, applied);
    }
  }

  if (input.kind === "hint_revealed") {
    addUnique(next.revealedHintIds, input.hintId);
  }

  if (input.kind === "report_submitted") {
    next.submittedReport = { ...input.report };
    for (const flagEffect of input.flagEffects) {
      applyEffect(next, { type: "set_flag", key: flagEffect.key, value: flagEffect.value }, content, applied);
    }
  }

  if (input.kind === "outcome_selected") {
    next.selectedOutcomeId = input.outcomeId;
    next.caseCompleted = input.outcomeId !== null;
    if (input.outcomeId !== null) {
      const outcome = content.case.outcomes.find((candidate) => candidate.id === input.outcomeId);
      if (!outcome) {
        throw new EngineError(`unknown outcome '${input.outcomeId}'`);
      }
      for (const effect of outcome.effects) {
        applyEffect(next, effect, content, applied);
      }
    }
  }

  const eligible = [...content.case.triggers]
    .sort((a, b) => b.priority - a.priority)
    .filter((trigger) => !(trigger.once && next.firedTriggerIds.includes(trigger.id)));

  for (const trigger of eligible) {
    if (evaluateRule(trigger.rule, toRuleEvaluationContext(next))) {
      for (const effect of trigger.effects) {
        applyEffect(next, effect, content, applied);
      }
      if (trigger.once) {
        addUnique(next.firedTriggerIds, trigger.id);
      }
    }
  }

  return { state: freezeState(next), appliedEffects: Object.freeze([...applied]) };
}

// ---------------------------------------------------------------------------
// Input and context projection
// ---------------------------------------------------------------------------

function toRuleEvent(input: EngineInput): RuleEvent {
  if (input.kind === "game_event") return { ...input.event };
  if (input.kind === "evidence_discovered") {
    return { type: "evidence_discovered", entityId: input.evidenceId };
  }
  if (input.kind === "dialogue_choice_selected") {
    return { type: "dialogue_choice_selected", entityId: input.choiceId };
  }
  if (input.kind === "hint_revealed") {
    return { type: "hint_revealed", entityId: input.hintId };
  }
  if (input.kind === "report_submitted") {
    return { type: "report_submitted" };
  }
  if (input.kind === "outcome_selected") {
    return input.outcomeId === null
      ? { type: "outcome_selected" }
      : { type: "outcome_selected", entityId: input.outcomeId };
  }
  if (input.kind === "checkpoint_restore_requested") {
    return { type: "checkpoint_restore_requested" };
  }
  return { type: "checkpoint_requested" };
}

function resolveChoice(choiceId: string, content: ContentBundle): DialogueChoice | undefined {
  for (const node of content.dialogue) {
    for (const choice of node.choices ?? []) {
      if (choice.id === choiceId) return choice;
    }
  }
  return undefined;
}

// ---------------------------------------------------------------------------
// Effect application
// ---------------------------------------------------------------------------

function applyEffect(
  next: MutableState,
  effect: GameEffect,
  content: ContentBundle,
  applied: GameEffect[],
): void {
  switch (effect.type) {
    case "unlock_record": {
      requireExists("record", effect.recordId, indexes(content).recordIds);
      addUnique(next.unlockedRecords, effect.recordId);
      applied.push(effect);
      return;
    }
    case "unlock_application": {
      addUnique(next.unlockedApplications, effect.applicationId);
      applied.push(effect);
      return;
    }
    case "queue_dialogue": {
      requireExists("dialogue node", effect.nodeId, indexes(content).dialogueNodeIds);
      next.queuedDialogue.push(effect.nodeId);
      applied.push(effect);
      return;
    }
    case "start_objective": {
      const objectiveIds = indexes(content).objectiveIds;
      requireExists("objective", effect.objectiveId, objectiveIds);
      if (!next.completedObjectives.includes(effect.objectiveId)) {
        addUnique(next.activeObjectives, effect.objectiveId);
      }
      applied.push(effect);
      return;
    }
    case "complete_objective": {
      const objectiveIds = indexes(content).objectiveIds;
      requireExists("objective", effect.objectiveId, objectiveIds);
      removeValue(next.activeObjectives, effect.objectiveId);
      addUnique(next.completedObjectives, effect.objectiveId);
      applied.push(effect);
      return;
    }
    case "set_flag": {
      next.flags[effect.key] = effect.value;
      applied.push(effect);
      return;
    }
    case "discover_evidence": {
      requireExists("evidence", effect.evidenceId, indexes(content).evidenceIds);
      addUnique(next.discoveredEntityIds, effect.evidenceId);
      applied.push(effect);
      return;
    }
    case "play_audio_cue": {
      requireExists("asset", effect.assetId, indexes(content).assetIds);
      next.audioCues.push(effect.assetId);
      applied.push(effect);
      return;
    }
    case "show_notification": {
      next.notifications.push(effect.notificationId);
      applied.push(effect);
      return;
    }
    default: {
      const neverEffect: never = effect;
      throw new EngineError(`unhandled game effect: ${JSON.stringify(neverEffect)}`);
    }
  }
}

function indexes(content: ContentBundle): ContentIndexes {
  return {
    recordIds: new Set(content.records.map((record) => record.id)),
    dialogueNodeIds: new Set(content.dialogue.map((node) => node.id)),
    objectiveIds: new Set(content.case.objectives.map((objective) => objective.id)),
    evidenceIds: new Set(content.evidence.map((evidence) => evidence.id)),
    assetIds: new Set(content.assets.map((asset) => asset.id)),
  };
}

function requireExists(targetKind: string, id: string, registry: ReadonlySet<string>): void {
  if (!registry.has(id)) {
    throw new EngineError(`unknown ${targetKind} '${id}'`);
  }
}

// ---------------------------------------------------------------------------
// State plumbing
// ---------------------------------------------------------------------------

interface MutableState {
  flags: Record<string, string | number | boolean>;
  eventHistory: RuleEvent[];
  discoveredEntityIds: string[];
  unlockedRecords: string[];
  unlockedApplications: string[];
  activeObjectives: string[];
  completedObjectives: string[];
  selectedChoices: string[];
  firedTriggerIds: string[];
  queuedDialogue: string[];
  audioCues: string[];
  notifications: string[];
  revealedHintIds: string[];
  submittedReport: Record<string, unknown> | null;
  selectedOutcomeId: string | null;
  caseCompleted: boolean;
}

function addUnique(list: string[], value: string): void {
  if (!list.includes(value)) list.push(value);
}

function removeValue(list: string[], value: string): void {
  const index = list.indexOf(value);
  if (index >= 0) list.splice(index, 1);
}

function cloneState(state: CaseEngineState): MutableState {
  return {
    flags: { ...state.flags },
    eventHistory: [...state.eventHistory],
    discoveredEntityIds: [...state.discoveredEntityIds],
    unlockedRecords: [...state.unlockedRecords],
    unlockedApplications: [...state.unlockedApplications],
    activeObjectives: [...state.activeObjectives],
    completedObjectives: [...state.completedObjectives],
    selectedChoices: [...state.selectedChoices],
    firedTriggerIds: [...state.firedTriggerIds],
    queuedDialogue: [...state.queuedDialogue],
    audioCues: [...state.audioCues],
    notifications: [...state.notifications],
    revealedHintIds: [...state.revealedHintIds],
    submittedReport: state.submittedReport === null ? null : { ...state.submittedReport },
    selectedOutcomeId: state.selectedOutcomeId,
    caseCompleted: state.caseCompleted,
  };
}

function freezeState(state: MutableState): CaseEngineState {
  Object.freeze(state.flags);
  if (state.submittedReport !== null) Object.freeze(state.submittedReport);
  [
    state.eventHistory,
    state.discoveredEntityIds,
    state.unlockedRecords,
    state.unlockedApplications,
    state.activeObjectives,
    state.completedObjectives,
    state.selectedChoices,
    state.firedTriggerIds,
    state.queuedDialogue,
    state.audioCues,
    state.notifications,
    state.revealedHintIds,
  ].forEach((list) => Object.freeze(list));
  return Object.freeze(state);
}
