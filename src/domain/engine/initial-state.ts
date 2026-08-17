import type { CaseEngineState } from "./types";

/** The empty, deterministic engine starting state. */
export function createInitialEngineState(): CaseEngineState {
  return {
    flags: {},
    eventHistory: [],
    discoveredEntityIds: [],
    unlockedRecords: [],
    unlockedApplications: [],
    activeObjectives: [],
    completedObjectives: [],
    selectedChoices: [],
    firedTriggerIds: [],
    queuedDialogue: [],
    audioCues: [],
    notifications: [],
    revealedHintIds: [],
    submittedReport: null,
    selectedOutcomeId: null,
    caseCompleted: false,
  };
}
