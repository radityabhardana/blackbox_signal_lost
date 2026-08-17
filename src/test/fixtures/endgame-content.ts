import { stepCaseEngine } from "@/domain/engine";
import type { CaseEngineState, EngineInput } from "@/domain/engine";
import type { ContentBundle } from "@/content/validator";
import type { ConclusionDefinition } from "@/content/schemas";
import { loadCase001Session } from "@/content/cases/case_001_missing_signal";

export interface EndgameHarnessSession {
  readonly content: ContentBundle;
  readonly initialState: CaseEngineState;
  readonly unlockedConclusion: ConclusionDefinition;
}

export interface EndgameHarnessOptions {
  /** Fire the Stage 5 ask-proof choice so ev_001_checksum_record is discovered. */
  readonly withProofPath?: boolean;
}

/**
 * Harness state for endgame E2E: loads the PRODUCTION Case 001 content bundle
 * (loadCase001Session already applies the case_001_bootstrap event), then steps
 * the real engine deterministically through Stages 1–4 (Option 2 branch) to a
 * post-Stage-4 state where obj_003 is completed and app_conclusion is
 * unlocked. The masked-contact dialogue (dialogue_001_stage5_masked) is queued
 * by trigger_005_masked_surface. Optionally also fires the Stage 5 proof choice
 * (choice_001_stage5_proof), which unlocks ev_001_checksum_record.
 *
 * The outcome evaluation still runs production code: the harness only
 * bootstraps the session, it never short-circuits submission.
 */
export function createEndgameHarnessSession(
  options: EndgameHarnessOptions = {},
): EndgameHarnessSession {
  const { content, initialState: bootstrapped } = loadCase001Session();

  const inputs: readonly EngineInput[] = [
    { kind: "game_event", event: { type: "record_opened", entityId: "rec_001_ferry_departure" } },
    { kind: "game_event", event: { type: "record_opened", entityId: "rec_001_emergency_call" } },
    { kind: "game_event", event: { type: "puzzle_completed", entityId: "puzzle_001_ferry_authenticity" } },
    { kind: "dialogue_choice_selected", choiceId: "choice_001_stage3_offline" },
    { kind: "game_event", event: { type: "record_opened", entityId: "rec_001_node7_summary" } },
    { kind: "game_event", event: { type: "record_opened", entityId: "rec_001_manual_escalation" } },
    { kind: "game_event", event: { type: "record_opened", entityId: "rec_001_corridor_access" } },
    ...(options.withProofPath === true
      ? [{ kind: "dialogue_choice_selected", choiceId: "choice_001_stage5_proof" } as const]
      : []),
  ];

  let state = bootstrapped;
  for (const input of inputs) {
    state = stepCaseEngine(state, input, content).state;
  }

  if (!state.completedObjectives.includes("obj_003_reason_for_north_barrier")) {
    throw new Error("endgame harness: Stage 4 did not complete obj_003");
  }
  if (!state.unlockedApplications.includes("app_conclusion")) {
    throw new Error("endgame harness: app_conclusion not unlocked after Stage 4");
  }

  const unlockedConclusion = content.conclusions[0];
  if (unlockedConclusion === undefined) {
    throw new Error("endgame harness: no conclusion defined in case content");
  }

  return { content, initialState: state, unlockedConclusion };
}