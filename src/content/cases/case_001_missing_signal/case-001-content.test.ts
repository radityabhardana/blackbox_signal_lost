import { describe, expect, it } from "vitest";
import { validateContentBundle } from "@/content/validator";
import type { ContentBundle } from "@/content/validator";
import { createInitialEngineState, stepCaseEngine, toRuleEvaluationContext } from "@/domain/engine";
import type { CaseEngineState } from "@/domain/engine";
import { evaluateRule } from "@/domain/rules";
import {
  attachEvidence,
  createEmptyReportDraft,
  prepareSubmission,
  selectClaimAnswer,
  selectDisclosure,
  selectOutcome,
} from "@/domain/outcomes";
import { CASE_001_SLOT_ID, loadCase001Session } from "./index";

/** Post-Stage-2 engine state: ferry + emergency reviewed, puzzle solved.
 * Stage 2 is completed and dialogue_001_stage3_pressure is queued by the
 * trigger_003_stage3_surface trigger. */
function stage3ReadyState(content: ContentBundle, initialState: CaseEngineState): CaseEngineState {
  const afterFerry = stepCaseEngine(
    initialState,
    { kind: "game_event", event: { type: "record_opened", entityId: "rec_001_ferry_departure" } },
    content,
  ).state;
  const afterEmergency = stepCaseEngine(
    afterFerry,
    { kind: "game_event", event: { type: "record_opened", entityId: "rec_001_emergency_call" } },
    content,
  ).state;
  return stepCaseEngine(
    afterEmergency,
    { kind: "game_event", event: { type: "puzzle_completed", entityId: "puzzle_001_ferry_authenticity" } },
    content,
  ).state;
}

describe("Case 001 content bundle", () => {
  it("loadCase001Session returns a valid ContentBundle", () => {
    const { content } = loadCase001Session();
    expect(content.case.id).toBe("case_001_missing_signal");
  });

  it("validateContentBundle passes for Case 001", () => {
    const { content } = loadCase001Session();
    expect(validateContentBundle(content).success).toBe(true);
  });

  it("bootstrap starts obj_001_verify_location", () => {
    const { initialState } = loadCase001Session();
    expect(initialState.activeObjectives).toContain("obj_001_verify_location");
  });

  it("bootstrap queues Sera intro dialogue", () => {
    const { initialState } = loadCase001Session();
    expect(initialState.queuedDialogue).toContain("dialogue_001_sera_intro");
  });

  it("bootstrap unlocks expected applications", () => {
    const { initialState } = loadCase001Session();
    for (const appId of ["app_mail", "app_records", "app_evidence_board", "app_objectives"]) {
      expect(initialState.unlockedApplications).toContain(appId);
    }
  });

  it("ferry record_opened discovers ev_001_ferry_departure", () => {
    const { content, initialState } = loadCase001Session();
    const { state } = stepCaseEngine(
      initialState,
      { kind: "game_event", event: { type: "record_opened", entityId: "rec_001_ferry_departure" } },
      content,
    );
    expect(state.discoveredEntityIds).toContain("ev_001_ferry_departure");
  });

  it("both evidence discovered completes objective", () => {
    const { content, initialState } = loadCase001Session();
    const afterFerry = stepCaseEngine(
      initialState,
      { kind: "game_event", event: { type: "record_opened", entityId: "rec_001_ferry_departure" } },
      content,
    ).state;
    const afterEmergency = stepCaseEngine(
      afterFerry,
      { kind: "game_event", event: { type: "record_opened", entityId: "rec_001_emergency_call" } },
      content,
    ).state;
    expect(afterEmergency.completedObjectives).toContain("obj_001_verify_location");
    expect(afterEmergency.activeObjectives).not.toContain("obj_001_verify_location");
  });

  it("CASE_001_SLOT_ID is exported", () => {
    expect(CASE_001_SLOT_ID).toBe("slot_case_001");
  });

  it("Stage 2 objective exists and validates", () => {
    const { content } = loadCase001Session();
    const ids = content.case.objectives.map((objective) => objective.id);
    expect(ids).toContain("obj_002_determine_authenticity");
  });

  it("Stage 1 completion activates Stage 2 in one engine step", () => {
    const { content, initialState } = loadCase001Session();
    const afterFerry = stepCaseEngine(
      initialState,
      { kind: "game_event", event: { type: "record_opened", entityId: "rec_001_ferry_departure" } },
      content,
    ).state;
    const afterEmergency = stepCaseEngine(
      afterFerry,
      { kind: "game_event", event: { type: "record_opened", entityId: "rec_001_emergency_call" } },
      content,
    ).state;
    expect(afterEmergency.completedObjectives).toContain("obj_001_verify_location");
    expect(afterEmergency.activeObjectives).toContain("obj_002_determine_authenticity");
    expect(afterEmergency.unlockedApplications).toContain("app_signal_analyzer");
  });

  it("puzzle_completed completes Stage 2 and discovers replay signature", () => {
    const { content, initialState } = loadCase001Session();
    const afterFerry = stepCaseEngine(
      initialState,
      { kind: "game_event", event: { type: "record_opened", entityId: "rec_001_ferry_departure" } },
      content,
    ).state;
    const afterEmergency = stepCaseEngine(
      afterFerry,
      { kind: "game_event", event: { type: "record_opened", entityId: "rec_001_emergency_call" } },
      content,
    ).state;
    const afterPuzzle = stepCaseEngine(
      afterEmergency,
      { kind: "game_event", event: { type: "puzzle_completed", entityId: "puzzle_001_ferry_authenticity" } },
      content,
    ).state;
    expect(afterPuzzle.completedObjectives).toContain("obj_002_determine_authenticity");
    expect(afterPuzzle.activeObjectives).not.toContain("obj_002_determine_authenticity");
    expect(afterPuzzle.discoveredEntityIds).toContain("ev_001_replay_signature");
    expect(afterPuzzle.flags.ferry_record_forged).toBe(true);
  });

  it("puzzle references resolve to bundle entities", () => {
    const { content } = loadCase001Session();
    const puzzle = content.puzzles[0]!;
    const evidenceIds = content.evidence.map((evidence) => evidence.id);
    const recordIds = content.records.map((record) => record.id);
    expect(evidenceIds).toContain(puzzle.sourceEvidenceId);
    expect(evidenceIds).toContain(puzzle.solutionEvidenceId);
    expect(recordIds).toContain(puzzle.referenceRecordId);
  });

  it("decisive properties are exactly gate device and account signature", () => {
    const { content } = loadCase001Session();
    const decisiveIds = content.puzzles[0]!.properties.filter((property) => property.decisive).map((property) => property.id);
    expect(decisiveIds).toEqual(["property_gate_device", "property_account_signature"]);
  });

  it("Stage 5 and 6 content present, no Stage 7", () => {
    const { content } = loadCase001Session();
    expect(content.puzzles).toHaveLength(1);
    expect(content.puzzles[0]!.id).toBe("puzzle_001_ferry_authenticity");
    expect(content.case.objectives).toHaveLength(3);
    // Stage 6 conclusion is filled: >=4 claim slots, exactly 4 disclosures.
    const conclusion = content.conclusions[0]!;
    expect(conclusion.claimSlots.length).toBeGreaterThanOrEqual(4);
    expect(conclusion.disclosureChoices).toHaveLength(4);
    // Outcomes: the Stage 1 placeholder plus the four ending outcomes.
    expect(content.case.outcomes.length).toBeGreaterThanOrEqual(5);
    const outcomeIds = content.case.outcomes.map((outcome) => outcome.id);
    for (const id of [
      "outcome_001_stage1",
      "outcome_001_protected_truth",
      "outcome_001_official_compliance",
      "outcome_001_public_exposure",
      "outcome_001_misidentified",
    ]) {
      expect(outcomeIds).toContain(id);
    }
    // Endings collection has the authored entries: stage1 placeholder + A/B/C/D
    // + the hidden meta epilogue.
    const endingIds = content.endings.map((ending) => ending.id);
    for (const id of [
      "ending_001_stage1",
      "ending_001_protected_truth",
      "ending_001_official_compliance",
      "ending_001_public_exposure",
      "ending_001_misidentified",
      "ending_001_blackbox_meta",
    ]) {
      expect(endingIds).toContain(id);
    }
    // Stage 5 masked-contact choices exist.
    const choiceIds = content.dialogue.flatMap((node) => (node.choices ?? []).map((choice) => choice.id));
    for (const id of [
      "choice_001_stage5_ignore",
      "choice_001_stage5_proof",
      "choice_001_stage5_identity",
      "choice_001_stage5_forward",
    ]) {
      expect(choiceIds).toContain(id);
    }
    // Stage 5 checksum evidence present.
    expect(content.evidence.map((evidence) => evidence.id)).toContain("ev_001_checksum_record");
    // No Stage 7 markers: no ids beyond the Stage 1-6 set.
    const knownIds = new Set([
      ...content.case.objectives.map((objective) => objective.id),
      ...content.case.triggers.map((trigger) => trigger.id),
      ...content.case.outcomes.map((outcome) => outcome.id),
      ...content.records.map((record) => record.id),
      ...content.evidence.map((evidence) => evidence.id),
      ...content.dialogue.map((node) => node.id),
      ...content.endings.map((ending) => ending.id),
      ...choiceIds,
    ]);
    expect(knownIds.has("stage7")).toBe(false);
    expect(knownIds.has("stage_7")).toBe(false);
    for (const id of knownIds) {
      expect(id).not.toMatch(/stage_?7/);
    }
  });

  it("Stage 3 surfaces after Stage 2 completes", () => {
    const { content, initialState } = loadCase001Session();
    const state = stage3ReadyState(content, initialState);
    expect(state.completedObjectives).toContain("obj_002_determine_authenticity");
    expect(state.queuedDialogue).toContain("dialogue_001_stage3_pressure");
  });

  it("all three Stage 3 choices are authored and resolve", () => {
    const { content, initialState } = loadCase001Session();
    const preChoice = stage3ReadyState(content, initialState);
    const branches = [
      { choiceId: "choice_001_stage3_ciab", flag: "tablet_path_ciab", reply: "dialogue_001_stage3_reply_ciab" },
      { choiceId: "choice_001_stage3_offline", flag: "tablet_path_offline", reply: "dialogue_001_stage3_reply_offline" },
      { choiceId: "choice_001_stage3_pelaga", flag: "tablet_path_pelaga", reply: "dialogue_001_stage3_reply_pelaga" },
    ];
    for (const branch of branches) {
      // Each branch runs from the same pre-choice state.
      const state = stepCaseEngine(
        preChoice,
        { kind: "dialogue_choice_selected", choiceId: branch.choiceId },
        content,
      ).state;
      expect(state.flags[branch.flag]).toBe(true);
      const tabletFlags = Object.keys(state.flags).filter(
        (key) => key.startsWith("tablet_path_") && state.flags[key] === true,
      );
      expect(tabletFlags).toEqual([branch.flag]);
      expect(state.queuedDialogue).toContain(branch.reply);
    }
  });

  it("Stage 4 activates on any branch", () => {
    const { content, initialState } = loadCase001Session();
    const preChoice = stage3ReadyState(content, initialState);
    for (const choiceId of ["choice_001_stage3_ciab", "choice_001_stage3_offline", "choice_001_stage3_pelaga"]) {
      const state = stepCaseEngine(
        preChoice,
        { kind: "dialogue_choice_selected", choiceId },
        content,
      ).state;
      expect(state.activeObjectives).toContain("obj_003_reason_for_north_barrier");
    }
  });

  it("OPTION 2 discovers the diagnostic note", () => {
    const { content, initialState } = loadCase001Session();
    const preChoice = stage3ReadyState(content, initialState);
    const state = stepCaseEngine(
      preChoice,
      { kind: "dialogue_choice_selected", choiceId: "choice_001_stage3_offline" },
      content,
    ).state;
    // Flag-gated trigger (NOT search-gated) discovers the note.
    expect(state.discoveredEntityIds).toContain("ev_001_diagnostic_note");
    expect(state.flags.sera_trust_increased).toBe(true);
  });

  it("OPTION 1 has no fabricated redaction content", () => {
    const { content, initialState } = loadCase001Session();
    const preChoice = stage3ReadyState(content, initialState);
    const state = stepCaseEngine(
      preChoice,
      { kind: "dialogue_choice_selected", choiceId: "choice_001_stage3_ciab" },
      content,
    ).state;
    expect(state.flags.tablet_path_ciab).toBe(true);
    // Source gap (docs/05 L156): "some data is automatically redacted" — no doc
    // names WHICH data. The generic ciab flag represents the branch; no record
    // or evidence claims specific redactions.
    const reliability = content.records.find((record) => record.id === "rec_001_reliability_report");
    expect(reliability?.metadata.mention_manual_escalation).toBe(false);
    const fabricatedRedaction = [...content.records, ...content.evidence].some((item) =>
      item.id.toLowerCase().includes("redact"),
    );
    expect(fabricatedRedaction).toBe(false);
  });

  it("OPTION 3 has no fabricated Reno content beyond documented response", () => {
    const { content, initialState } = loadCase001Session();
    const preChoice = stage3ReadyState(content, initialState);
    const state = stepCaseEngine(
      preChoice,
      { kind: "dialogue_choice_selected", choiceId: "choice_001_stage3_pelaga" },
      content,
    ).state;
    expect(state.flags.tablet_path_pelaga).toBe(true);
    expect(state.queuedDialogue).toContain("dialogue_001_stage3_reply_pelaga");
    const reply = content.dialogue.find((node) => node.id === "dialogue_001_stage3_reply_pelaga")!;
    expect(reply.channelId).toBe("channel_001_messenger");
    expect(reply.speakerId).toBe("char_sera_wibawa");
    // docs/05 only documents "Reno responds quickly"; the reply must not invent
    // quoted dialogue or further specific detail.
    expect(reply.text).toContain("Reno");
    expect(reply.text).toContain("quickly");
    expect(reply.text).not.toContain('"');
    // Source gap (docs/05 L158): "one optional record becomes unavailable" — no
    // doc names the record, so no record may have been removed or gated this
    // slice: every authored rec_001_* remains (the Stage 5 checksum record is
    // flag-gated, not removed).
    const recordIds = content.records.map((record) => record.id);
    expect(recordIds).toHaveLength(10);
    for (const id of [
      "rec_001_ferry_departure",
      "rec_001_emergency_call",
      "rec_001_maya_profile",
      "rec_001_sera_field_note",
      "rec_001_ferry_baseline",
      "rec_001_node7_summary",
      "rec_001_manual_escalation",
      "rec_001_corridor_access",
      "rec_001_reliability_report",
      "rec_001_checksum_record",
    ]) {
      expect(recordIds).toContain(id);
    }
  });

  it("Stage 4 completes with the required evidence on every branch (no dead end)", () => {
    const { content, initialState } = loadCase001Session();
    const preChoice = stage3ReadyState(content, initialState);
    const branches = [
      { choiceId: "choice_001_stage3_ciab", noteDiscovered: false },
      { choiceId: "choice_001_stage3_offline", noteDiscovered: true },
      { choiceId: "choice_001_stage3_pelaga", noteDiscovered: false },
    ];
    for (const branch of branches) {
      const afterChoice = stepCaseEngine(
        preChoice,
        { kind: "dialogue_choice_selected", choiceId: branch.choiceId },
        content,
      ).state;
      const afterSummary = stepCaseEngine(
        afterChoice,
        { kind: "game_event", event: { type: "record_opened", entityId: "rec_001_node7_summary" } },
        content,
      ).state;
      expect(afterSummary.discoveredEntityIds).toContain("ev_001_node7_summary");
      const afterEscalation = stepCaseEngine(
        afterSummary,
        { kind: "game_event", event: { type: "record_opened", entityId: "rec_001_manual_escalation" } },
        content,
      ).state;
      const afterCorridor = stepCaseEngine(
        afterEscalation,
        { kind: "game_event", event: { type: "record_opened", entityId: "rec_001_corridor_access" } },
        content,
      ).state;
      // obj_003 completes even when the optional diagnostic note was never
      // discovered (ciab/pelaga branches): the note is NOT in the completion
      // rule, so completion is branch-independent.
      expect(afterCorridor.completedObjectives).toContain("obj_003_reason_for_north_barrier");
      expect(afterCorridor.activeObjectives).not.toContain("obj_003_reason_for_north_barrier");
      expect(afterCorridor.discoveredEntityIds.includes("ev_001_diagnostic_note")).toBe(branch.noteDiscovered);
    }
  });

  it("optional isolation event is discovered but not required", () => {
    const { content, initialState } = loadCase001Session();
    const preChoice = stage3ReadyState(content, initialState);
    const afterChoice = stepCaseEngine(
      preChoice,
      { kind: "dialogue_choice_selected", choiceId: "choice_001_stage3_ciab" },
      content,
    ).state;
    const afterSummary = stepCaseEngine(
      afterChoice,
      { kind: "game_event", event: { type: "record_opened", entityId: "rec_001_node7_summary" } },
      content,
    ).state;
    const afterEscalation = stepCaseEngine(
      afterSummary,
      { kind: "game_event", event: { type: "record_opened", entityId: "rec_001_manual_escalation" } },
      content,
    ).state;
    const afterCorridor = stepCaseEngine(
      afterEscalation,
      { kind: "game_event", event: { type: "record_opened", entityId: "rec_001_corridor_access" } },
      content,
    ).state;
    expect(afterCorridor.discoveredEntityIds).toContain("ev_001_isolation_event");
    // The completion trigger must not reference the optional isolation event.
    const completionTrigger = content.case.triggers.find((trigger) => trigger.id === "trigger_004_obj003_complete")!;
    const effectRefs = completionTrigger.effects.flatMap((effect) =>
      effect.type === "discover_evidence" ? [effect.evidenceId] : [],
    );
    expect(effectRefs).not.toContain("ev_001_isolation_event");
    const objective = content.case.objectives.find((item) => item.id === "obj_003_reason_for_north_barrier")!;
    expect(JSON.stringify(objective.completionRule)).not.toContain("ev_001_isolation_event");
    // The optional item is flagged optional in content.
    const isolationEvidence = content.evidence.find((item) => item.id === "ev_001_isolation_event")!;
    expect(isolationEvidence.optional).toBe(true);
  });

  it("hint ladders are complete 4-tier per objective", () => {
    const { content } = loadCase001Session();
    expect(content.case.objectives).toHaveLength(3);
    for (const objective of content.case.objectives) {
      const hints = objective.hintIds.map((hintId) => content.hints.find((hint) => hint.id === hintId));
      expect(hints).toHaveLength(4);
      expect(hints.every((hint) => hint !== undefined)).toBe(true);
      expect(hints.map((hint) => hint!.tier).sort()).toEqual([1, 2, 3, 4]);
    }
  });

  it("obj_003 hints avoid Stage 5/6 content", () => {
    const { content } = loadCase001Session();
    const banned = ["tablet", "masked", "forward", "archive leak", "blackbox reveal", "best choice"];
    for (const tier of [1, 2, 3, 4]) {
      const hint = content.hints.find((item) => item.id === `hint_003_north_barrier_${tier}`)!;
      expect(hint).toBeDefined();
      const lower = hint.text.toLowerCase();
      for (const word of banned) {
        expect(lower).not.toContain(word);
      }
    }
  });

  it("validateContentBundle passes with endings", () => {
    const { content } = loadCase001Session();
    expect(validateContentBundle(content).success).toBe(true);
  });

  it("Stage 5 masked contact surfaces after Stage 4", () => {
    const { content, initialState } = loadCase001Session();
    const preChoice = stage3ReadyState(content, initialState);
    const afterChoice = stepCaseEngine(
      preChoice,
      { kind: "dialogue_choice_selected", choiceId: "choice_001_stage3_ciab" },
      content,
    ).state;
    const afterSummary = stepCaseEngine(
      afterChoice,
      { kind: "game_event", event: { type: "record_opened", entityId: "rec_001_node7_summary" } },
      content,
    ).state;
    const afterEscalation = stepCaseEngine(
      afterSummary,
      { kind: "game_event", event: { type: "record_opened", entityId: "rec_001_manual_escalation" } },
      content,
    ).state;
    const afterCorridor = stepCaseEngine(
      afterEscalation,
      { kind: "game_event", event: { type: "record_opened", entityId: "rec_001_corridor_access" } },
      content,
    ).state;
    expect(afterCorridor.completedObjectives).toContain("obj_003_reason_for_north_barrier");
    // trigger_005_masked_surface fires once Stage 4 is complete.
    expect(afterCorridor.queuedDialogue).toContain("dialogue_001_stage5_masked");
    // The masked node's four choices resolve to authored nodes.
    const node = content.dialogue.find((item) => item.id === "dialogue_001_stage5_masked")!;
    expect(node.choices).toHaveLength(4);
    for (const choice of node.choices ?? []) {
      expect(content.dialogue.some((candidate) => candidate.id === choice.nextNodeId)).toBe(true);
    }
  });

  it("ask for proof unlocks the checksum record", () => {
    const { content, initialState } = loadCase001Session();
    const preChoice = stage3ReadyState(content, initialState);
    const afterStage3 = stepCaseEngine(
      preChoice,
      { kind: "dialogue_choice_selected", choiceId: "choice_001_stage3_ciab" },
      content,
    ).state;
    const afterSummary = stepCaseEngine(
      afterStage3,
      { kind: "game_event", event: { type: "record_opened", entityId: "rec_001_node7_summary" } },
      content,
    ).state;
    const afterEscalation = stepCaseEngine(
      afterSummary,
      { kind: "game_event", event: { type: "record_opened", entityId: "rec_001_manual_escalation" } },
      content,
    ).state;
    const afterStage4 = stepCaseEngine(
      afterEscalation,
      { kind: "game_event", event: { type: "record_opened", entityId: "rec_001_corridor_access" } },
      content,
    ).state;
    const afterProof = stepCaseEngine(
      afterStage4,
      { kind: "dialogue_choice_selected", choiceId: "choice_001_stage5_proof" },
      content,
    ).state;
    expect(afterProof.flags.masked_proof_requested).toBe(true);
    expect(afterProof.flags.masked_checksum_unlocked).toBe(true);
    // Flag-gated trigger discovers the anonymized checksum record.
    expect(afterProof.discoveredEntityIds).toContain("ev_001_checksum_record");
    // The checksum record availabilityRule is satisfied in the post-choice state.
    const record = content.records.find((item) => item.id === "rec_001_checksum_record")!;
    expect(evaluateRule(record.availabilityRule, toRuleEvaluationContext(afterProof))).toBe(true);
  });

  it("forward sets the compliance flag", () => {
    const { content, initialState } = loadCase001Session();
    const preChoice = stage3ReadyState(content, initialState);
    const afterStage3 = stepCaseEngine(
      preChoice,
      { kind: "dialogue_choice_selected", choiceId: "choice_001_stage3_ciab" },
      content,
    ).state;
    const afterSummary = stepCaseEngine(
      afterStage3,
      { kind: "game_event", event: { type: "record_opened", entityId: "rec_001_node7_summary" } },
      content,
    ).state;
    const afterEscalation = stepCaseEngine(
      afterSummary,
      { kind: "game_event", event: { type: "record_opened", entityId: "rec_001_manual_escalation" } },
      content,
    ).state;
    const afterStage4 = stepCaseEngine(
      afterEscalation,
      { kind: "game_event", event: { type: "record_opened", entityId: "rec_001_corridor_access" } },
      content,
    ).state;
    const afterForward = stepCaseEngine(
      afterStage4,
      { kind: "dialogue_choice_selected", choiceId: "choice_001_stage5_forward" },
      content,
    ).state;
    expect(afterForward.flags.masked_forwarded).toBe(true);
  });

  it("all four endings are reachable (parameterized reachability)", () => {
    const { content } = loadCase001Session();
    const correctAnswers = [
      { claimId: "claim_001_location", optionId: "claim_001_location_north_barrier" },
      { claimId: "claim_001_ferry_record", optionId: "claim_001_ferry_forged" },
      { claimId: "claim_001_obstruction", optionId: "claim_001_obstruction_reno" },
      { claimId: "claim_001_return_reason", optionId: "claim_001_reason_evidence" },
    ];
    const wrongAnswers = [
      { claimId: "claim_001_location", optionId: "claim_001_location_ferry" },
      { claimId: "claim_001_ferry_record", optionId: "claim_001_ferry_authentic" },
      { claimId: "claim_001_obstruction", optionId: "claim_001_obstruction_nara" },
      { claimId: "claim_001_return_reason", optionId: "claim_001_reason_sabotage" },
    ];
    const evidenceIds = [
      "ev_001_corridor_access",
      "ev_001_emergency_call",
      "ev_001_replay_signature",
    ];
    const cases: Array<{ ending: string; disclosureId: string; answers: typeof correctAnswers }> = [
      // A — Protected truth: all four correct + MIO recipient.
      { ending: "outcome_001_protected_truth", disclosureId: "disclosure_001_mio_redacted", answers: correctAnswers },
      // B — Official compliance: Pelaga disclosure (docs/05 §5: "Forward masked
      // contact" / "Classify archive as stolen data").
      { ending: "outcome_001_official_compliance", disclosureId: "disclosure_001_pelaga", answers: correctAnswers },
      // C — Public exposure: leak to Open Signal.
      { ending: "outcome_001_public_exposure", disclosureId: "disclosure_001_open_signal", answers: correctAnswers },
      // D — Misidentified culprit: one wrong claim (docs/05 §5: "Accuse Nara or
      // Sera without valid evidence").
      { ending: "outcome_001_misidentified", disclosureId: "disclosure_001_mio_redacted", answers: wrongAnswers },
    ];
    for (const testCase of cases) {
      let draft = createEmptyReportDraft();
      for (const answer of testCase.answers) {
        draft = selectClaimAnswer(draft, answer.claimId, answer.optionId);
      }
      for (const evidenceId of evidenceIds) {
        draft = attachEvidence(draft, evidenceId);
      }
      draft = selectDisclosure(draft, testCase.disclosureId);
      const prepared = prepareSubmission(draft, content);
      if ("kind" in prepared) {
        throw new Error(`expected valid submission: ${prepared.errors.join(", ")}`);
      }
      const afterReport = stepCaseEngine(
        createInitialEngineState(),
        {
          kind: "report_submitted",
          report: {
            claimAnswers: { ...prepared.report.claimAnswers },
            evidenceIds: [...prepared.report.evidenceIds],
            disclosureChoiceId: prepared.report.disclosureChoiceId,
          },
          flagEffects: prepared.flagEffects,
        },
        content,
      ).state;
      const selection = selectOutcome(content.case.outcomes, afterReport);
      expect(selection.kind).toBe("selected");
      if (selection.kind === "selected") {
        expect(selection.outcome.id).toBe(testCase.ending);
      }
    }
  });

  it("no Stage 3 branch dead-ends into the endgame", () => {
    const { content, initialState } = loadCase001Session();
    const preChoice = stage3ReadyState(content, initialState);
    const branches = [
      { choiceId: "choice_001_stage3_ciab", noteDiscovered: false },
      { choiceId: "choice_001_stage3_offline", noteDiscovered: true },
      { choiceId: "choice_001_stage3_pelaga", noteDiscovered: false },
    ];
    for (const branch of branches) {
      const afterChoice = stepCaseEngine(
        preChoice,
        { kind: "dialogue_choice_selected", choiceId: branch.choiceId },
        content,
      ).state;
      const afterSummary = stepCaseEngine(
        afterChoice,
        { kind: "game_event", event: { type: "record_opened", entityId: "rec_001_node7_summary" } },
        content,
      ).state;
      const afterEscalation = stepCaseEngine(
        afterSummary,
        { kind: "game_event", event: { type: "record_opened", entityId: "rec_001_manual_escalation" } },
        content,
      ).state;
      const afterCorridor = stepCaseEngine(
        afterEscalation,
        { kind: "game_event", event: { type: "record_opened", entityId: "rec_001_corridor_access" } },
        content,
      ).state;
      expect(afterCorridor.completedObjectives).toContain("obj_003_reason_for_north_barrier");
      // Stage 6 conclusion unlocks regardless of the Stage 3 branch.
      expect(afterCorridor.unlockedApplications).toContain("app_conclusion");
      // A correct report resolves to a primary ending on every branch
      // (Protected Truth via correct facts + MIO disclosure).
      let draft = createEmptyReportDraft();
      draft = selectClaimAnswer(draft, "claim_001_location", "claim_001_location_north_barrier");
      draft = selectClaimAnswer(draft, "claim_001_ferry_record", "claim_001_ferry_forged");
      draft = selectClaimAnswer(draft, "claim_001_obstruction", "claim_001_obstruction_reno");
      draft = selectClaimAnswer(draft, "claim_001_return_reason", "claim_001_reason_evidence");
      for (const evidenceId of ["ev_001_corridor_access", "ev_001_emergency_call", "ev_001_replay_signature"]) {
        draft = attachEvidence(draft, evidenceId);
      }
      draft = selectDisclosure(draft, "disclosure_001_mio_redacted");
      const prepared = prepareSubmission(draft, content);
      if ("kind" in prepared) {
        throw new Error(`expected valid submission: ${prepared.errors.join(", ")}`);
      }
      const afterReport = stepCaseEngine(
        afterCorridor,
        {
          kind: "report_submitted",
          report: {
            claimAnswers: { ...prepared.report.claimAnswers },
            evidenceIds: [...prepared.report.evidenceIds],
            disclosureChoiceId: prepared.report.disclosureChoiceId,
          },
          flagEffects: prepared.flagEffects,
        },
        content,
      ).state;
      const selection = selectOutcome(content.case.outcomes, afterReport);
      expect(selection.kind).toBe("selected");
      if (selection.kind === "selected") {
        expect(selection.outcome.id).toBe("outcome_001_protected_truth");
      }
    }
  });
});
