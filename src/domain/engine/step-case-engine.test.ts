import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import path from "node:path";
import { contentBundleSchema } from "../../content/validator";
import { createInitialEngineState, stepCaseEngine, EngineError } from "./index";
import type { CaseEngineState, EngineInput, EngineResult } from "./index";
import type { ContentBundle } from "../../content/validator";
import type { GameEffect, TriggerDefinition } from "../../content/schemas";

const bundlePath = path.join(__dirname, "../../content/fixtures/bundles/valid/bundle_basic_valid.json");

function loadBundle(): ContentBundle {
  const raw = JSON.parse(readFileSync(bundlePath, "utf-8"));
  return contentBundleSchema.parse(raw);
}

function empty(): CaseEngineState {
  return createInitialEngineState();
}

function step(
  state: CaseEngineState,
  input: EngineInput,
  content: ContentBundle,
): EngineResult {
  return stepCaseEngine(state, input, content);
}

function alwaysTrigger(
  id: string,
  effects: GameEffect[],
  overrides: Partial<TriggerDefinition> = {},
): TriggerDefinition {
  return {
    id,
    once: false,
    priority: 0,
    rule: { always: true },
    effects,
    ...overrides,
  };
}

function flagEffect(key: string, value: string | number | boolean): GameEffect {
  return { type: "set_flag", key, value };
}

describe("engine state serialization", () => {
  it("produces directly JSON.stringify-compatible state", () => {
    const state = empty();
    expect(() => JSON.stringify(state)).not.toThrow();
    const json = JSON.stringify(state);
    const roundTripped = JSON.parse(json) as CaseEngineState;
    expect(roundTripped).toEqual(state);
  });

  it("round-trips state after a step", () => {
    const content = loadBundle();
    const result = step(empty(), { kind: "game_event", event: { type: "search_performed" } }, content);
    const roundTripped = JSON.parse(JSON.stringify(result.state)) as CaseEngineState;
    expect(roundTripped).toEqual(result.state);
  });
});

describe("engine inputs", () => {
  it("game_event appends exactly one history entry and no other state", () => {
    const content = loadBundle();
    const result = step(empty(), { kind: "game_event", event: { type: "record_opened", entityId: "record_test" } }, content);
    expect(result.state.eventHistory).toEqual([{ type: "record_opened", entityId: "record_test" }]);
    expect(result.state.discoveredEntityIds).toEqual([]);
    expect(result.state.selectedChoices).toEqual([]);
    expect(result.appliedEffects).toEqual([]);
  });

  it("evidence_discovered appends history and discovery state", () => {
    const content = loadBundle();
    const result = step(empty(), { kind: "evidence_discovered", evidenceId: "evidence_test" }, content);
    expect(result.state.eventHistory).toEqual([{ type: "evidence_discovered", entityId: "evidence_test" }]);
    expect(result.state.discoveredEntityIds).toEqual(["evidence_test"]);
  });

  it("dialogue_choice_selected appends history and selected choice", () => {
    const content = loadBundle();
    const result = step(empty(), { kind: "dialogue_choice_selected", choiceId: "choice_test" }, content);
    expect(result.state.eventHistory).toEqual([{ type: "dialogue_choice_selected", entityId: "choice_test" }]);
    expect(result.state.selectedChoices).toEqual(["choice_test"]);
  });
});

describe("hint reveals", () => {
  it("hint_revealed input records the hint id uniquely", () => {
    const content = loadBundle();
    const first = step(empty(), { kind: "hint_revealed", hintId: "hint_a" }, content);
    expect(first.state.revealedHintIds).toEqual(["hint_a"]);
    const second = step(first.state, { kind: "hint_revealed", hintId: "hint_a" }, content);
    expect(second.state.revealedHintIds).toEqual(["hint_a"]);
    const third = step(second.state, { kind: "hint_revealed", hintId: "hint_b" }, content);
    expect(third.state.revealedHintIds).toEqual(["hint_a", "hint_b"]);
  });

  it("hint_revealed does not change any other state", () => {
    const content = loadBundle();
    const withProgress: CaseEngineState = {
      ...empty(),
      flags: { clue: "found" },
      discoveredEntityIds: ["evidence_test"],
      selectedChoices: ["choice_other"],
      activeObjectives: ["objective_test"],
      completedObjectives: [],
      queuedDialogue: ["dialogue_test"],
      eventHistory: [{ type: "evidence_discovered", entityId: "evidence_test" }],
    };
    const result = step(withProgress, { kind: "hint_revealed", hintId: "hint_a" }, content);
    expect(result.state.flags).toEqual({ clue: "found" });
    expect(result.state.discoveredEntityIds).toEqual(["evidence_test"]);
    expect(result.state.selectedChoices).toEqual(["choice_other"]);
    expect(result.state.activeObjectives).toEqual(["objective_test"]);
    expect(result.state.completedObjectives).toEqual([]);
    expect(result.state.queuedDialogue).toEqual(["dialogue_test"]);
    expect(result.appliedEffects).toEqual([]);
    expect(result.state.eventHistory).toEqual([
      { type: "evidence_discovered", entityId: "evidence_test" },
      { type: "hint_revealed", entityId: "hint_a" },
    ]);
    expect(result.state.revealedHintIds).toEqual(["hint_a"]);
  });

  it("hint_revealed is recorded in eventHistory as type hint_revealed", () => {
    const content = loadBundle();
    const result = step(empty(), { kind: "hint_revealed", hintId: "hint_a" }, content);
    expect(result.state.eventHistory).toEqual([{ type: "hint_revealed", entityId: "hint_a" }]);
  });

  it("revealedHintIds survives clone/freeze", () => {
    const content = loadBundle();
    const revealed = step(empty(), { kind: "hint_revealed", hintId: "hint_a" }, content);
    const after = step(revealed.state, { kind: "game_event", event: { type: "search_performed" } }, content);
    expect(after.state.revealedHintIds).toEqual(["hint_a"]);
    expect(Object.isFrozen(after.state.revealedHintIds)).toBe(true);
  });
});

describe("trigger behavior", () => {
  it("false trigger applies no effects", () => {
    const content = loadBundle();
    content.case.triggers = [alwaysTrigger("t_false", [flagEffect("a", true)], { rule: { flagEquals: { key: "nope", value: true } } })];
    const result = step(empty(), { kind: "game_event", event: { type: "x" } }, content);
    expect(result.appliedEffects).toEqual([]);
    expect(result.state.flags).toEqual({});
  });

  it("true trigger applies effects", () => {
    const content = loadBundle();
    content.case.triggers = [alwaysTrigger("t_true", [flagEffect("a", true)])];
    const result = step(empty(), { kind: "game_event", event: { type: "x" } }, content);
    expect(result.appliedEffects).toEqual([{ type: "set_flag", key: "a", value: true }]);
    expect(result.state.flags).toEqual({ a: true });
  });

  it("higher numeric priority fires first", () => {
    const content = loadBundle();
    content.case.triggers = [
      alwaysTrigger("t_low", [flagEffect("a", 1)], { priority: 1 }),
      alwaysTrigger("t_high", [flagEffect("b", 2)], { priority: 5 }),
      alwaysTrigger("t_mid", [flagEffect("c", 3)], { priority: 3 }),
    ];
    const result = step(empty(), { kind: "game_event", event: { type: "x" } }, content);
    expect(result.appliedEffects.map((effect) => effect.type)).toEqual(["set_flag", "set_flag", "set_flag"]);
    expect(result.state.flags).toEqual({ b: 2, c: 3, a: 1 });
  });

  it("equal priority fires in declaration order", () => {
    const content = loadBundle();
    content.case.triggers = [
      alwaysTrigger("t_first", [flagEffect("first", true)], { priority: 1 }),
      alwaysTrigger("t_second", [flagEffect("second", true)], { priority: 1 }),
    ];
    const result = step(empty(), { kind: "game_event", event: { type: "x" } }, content);
    expect(result.appliedEffects.map((effect) => ("key" in effect ? effect.key : ""))).toEqual(["first", "second"]);
  });

  it("all matching triggers fire", () => {
    const content = loadBundle();
    content.case.triggers = [
      alwaysTrigger("t1", [flagEffect("a", true)]),
      alwaysTrigger("t2", [flagEffect("b", true)]),
    ];
    const result = step(empty(), { kind: "game_event", event: { type: "x" } }, content);
    expect(result.state.flags).toEqual({ a: true, b: true });
  });

  it("once trigger fires exactly once", () => {
    const content = loadBundle();
    content.case.triggers = [alwaysTrigger("t_once", [flagEffect("a", true)], { once: true })];
    const first = step(empty(), { kind: "game_event", event: { type: "x" } }, content);
    expect(first.state.flags).toEqual({ a: true });
    expect(first.state.firedTriggerIds).toEqual(["t_once"]);
    const second = step(first.state, { kind: "game_event", event: { type: "y" } }, content);
    expect(second.appliedEffects).toEqual([]);
    expect(second.state.firedTriggerIds).toEqual(["t_once"]);
  });

  it("non-once trigger fires again on a later matching step", () => {
    const content = loadBundle();
    content.case.triggers = [alwaysTrigger("t_rep", [flagEffect("a", true)])];
    const first = step(empty(), { kind: "game_event", event: { type: "x" } }, content);
    const second = step(first.state, { kind: "game_event", event: { type: "y" } }, content);
    expect(second.appliedEffects).toEqual([{ type: "set_flag", key: "a", value: true }]);
    expect(second.state.flags).toEqual({ a: true });
  });

  it("evaluates each trigger exactly once per step (no fixed-point loop)", () => {
    const content = loadBundle();
    content.case.triggers = [
      alwaysTrigger("t_self", [flagEffect("enabled", true)], { rule: { flagEquals: { key: "enabled", value: true } } }),
    ];
    const withEnabled: CaseEngineState = { ...empty(), flags: { enabled: true } };
    const result = step(withEnabled, { kind: "game_event", event: { type: "x" } }, content);
    expect(result.appliedEffects).toEqual([{ type: "set_flag", key: "enabled", value: true }]);
    expect(result.state.flags).toEqual({ enabled: true });
  });
});

describe("dialogue choice consequences", () => {
  it("dialogue choice unlocks a record via consequences", () => {
    const content = loadBundle();
    content.dialogue[0]!.choices![0]!.consequences = [{ type: "unlock_record", recordId: "record_test" }];
    const result = step(empty(), { kind: "dialogue_choice_selected", choiceId: "choice_test" }, content);
    expect(result.appliedEffects[0]).toEqual({ type: "unlock_record", recordId: "record_test" });
    expect(result.state.unlockedRecords).toEqual(["record_test"]);
  });

  it("choice consequences execute before trigger evaluation", () => {
    const content = loadBundle();
    content.dialogue[0]!.choices![0]!.consequences = [flagEffect("chosen", true)];
    content.case.triggers = [
      alwaysTrigger("t_after", [flagEffect("fired", true)], { rule: { flagEquals: { key: "chosen", value: true } } }),
    ];
    const result = step(empty(), { kind: "dialogue_choice_selected", choiceId: "choice_test" }, content);
    expect(result.appliedEffects.map((effect) => ("key" in effect ? effect.key : ""))).toEqual(["chosen", "fired"]);
    expect(result.state.flags).toEqual({ chosen: true, fired: true });
  });

  it("preserves authored consequence order", () => {
    const content = loadBundle();
    content.case.triggers = [];
    content.dialogue[0]!.choices![0]!.consequences = [
      flagEffect("first", true),
      flagEffect("second", true),
      flagEffect("third", true),
    ];
    const result = step(empty(), { kind: "dialogue_choice_selected", choiceId: "choice_test" }, content);
    expect(result.appliedEffects.map((effect) => ("key" in effect ? effect.key : ""))).toEqual(["first", "second", "third"]);
  });

  it("unknown choice id throws EngineError", () => {
    const content = loadBundle();
    expect(() => step(empty(), { kind: "dialogue_choice_selected", choiceId: "choice_missing" }, content)).toThrow(EngineError);
  });
});

describe("game effect variants", () => {
  it("applies all nine effect variants", () => {
    const content = loadBundle();
    content.case.triggers = [
      alwaysTrigger("t_all", [
        { type: "unlock_record", recordId: "record_test" },
        { type: "unlock_application", applicationId: "app_x" },
        { type: "queue_dialogue", nodeId: "dialogue_test" },
        { type: "start_objective", objectiveId: "objective_test" },
        { type: "complete_objective", objectiveId: "objective_test" },
        { type: "set_flag", key: "k", value: "v" },
        { type: "discover_evidence", evidenceId: "evidence_test" },
        { type: "play_audio_cue", assetId: "asset_test" },
        { type: "show_notification", notificationId: "notif_x" },
      ]),
    ];
    const result = step(empty(), { kind: "game_event", event: { type: "x" } }, content);
    expect(result.appliedEffects).toHaveLength(9);
    expect(result.state.unlockedRecords).toEqual(["record_test"]);
    expect(result.state.unlockedApplications).toEqual(["app_x"]);
    expect(result.state.queuedDialogue).toEqual(["dialogue_test"]);
    expect(result.state.completedObjectives).toEqual(["objective_test"]);
    expect(result.state.activeObjectives).toEqual([]);
    expect(result.state.flags).toEqual({ k: "v" });
    expect(result.state.discoveredEntityIds).toEqual(["evidence_test"]);
    expect(result.state.audioCues).toEqual(["asset_test"]);
    expect(result.state.notifications).toEqual(["notif_x"]);
  });

  it("unlock record is idempotent", () => {
    const content = loadBundle();
    content.case.triggers = [alwaysTrigger("t1", [{ type: "unlock_record", recordId: "record_test" }])];
    const first = step(empty(), { kind: "game_event", event: { type: "x" } }, content);
    const second = step(first.state, { kind: "game_event", event: { type: "y" } }, content);
    expect(second.state.unlockedRecords).toEqual(["record_test"]);
    expect(second.appliedEffects).toHaveLength(1);
  });

  it("queue dialogue allows duplicates", () => {
    const content = loadBundle();
    content.case.triggers = [alwaysTrigger("t1", [{ type: "queue_dialogue", nodeId: "dialogue_test" }])];
    const first = step(empty(), { kind: "game_event", event: { type: "x" } }, content);
    const second = step(first.state, { kind: "game_event", event: { type: "y" } }, content);
    expect(second.state.queuedDialogue).toEqual(["dialogue_test", "dialogue_test"]);
  });

  it("start then complete objective never leaves active+completed contradiction", () => {
    const content = loadBundle();
    content.case.triggers = [
      alwaysTrigger("t_start", [{ type: "start_objective", objectiveId: "objective_test" }]),
      alwaysTrigger("t_complete", [{ type: "complete_objective", objectiveId: "objective_test" }]),
    ];
    const result = step(empty(), { kind: "game_event", event: { type: "x" } }, content);
    expect(result.state.activeObjectives).toEqual([]);
    expect(result.state.completedObjectives).toEqual(["objective_test"]);
  });

  it("complete_objective removes an active objective", () => {
    const content = loadBundle();
    content.case.triggers = [alwaysTrigger("t_complete", [{ type: "complete_objective", objectiveId: "objective_test" }])];
    const started = step(empty(), { kind: "game_event", event: { type: "x" } }, content);
    const withActive: CaseEngineState = {
      ...started.state,
      activeObjectives: ["objective_test"],
      completedObjectives: [],
    };
    const result = step(withActive, { kind: "game_event", event: { type: "y" } }, content);
    expect(result.state.activeObjectives).toEqual([]);
    expect(result.state.completedObjectives).toEqual(["objective_test"]);
  });

  it("start_objective on a completed objective is a no-op", () => {
    const content = loadBundle();
    content.case.triggers = [alwaysTrigger("t_start", [{ type: "start_objective", objectiveId: "objective_test" }])];
    const withCompleted: CaseEngineState = { ...empty(), completedObjectives: ["objective_test"] };
    const result = step(withCompleted, { kind: "game_event", event: { type: "x" } }, content);
    expect(result.state.activeObjectives).toEqual([]);
    expect(result.state.completedObjectives).toEqual(["objective_test"]);
  });
});

describe("effect target validation", () => {
  it("unknown record target throws EngineError", () => {
    const content = loadBundle();
    content.case.triggers = [alwaysTrigger("t", [{ type: "unlock_record", recordId: "record_nope" }])];
    expect(() => step(empty(), { kind: "game_event", event: { type: "x" } }, content)).toThrow(EngineError);
  });

  it("unknown dialogue node target throws EngineError", () => {
    const content = loadBundle();
    content.case.triggers = [alwaysTrigger("t", [{ type: "queue_dialogue", nodeId: "node_nope" }])];
    expect(() => step(empty(), { kind: "game_event", event: { type: "x" } }, content)).toThrow(EngineError);
  });

  it("unknown objective target throws EngineError", () => {
    const content = loadBundle();
    content.case.triggers = [alwaysTrigger("t", [{ type: "start_objective", objectiveId: "obj_nope" }])];
    expect(() => step(empty(), { kind: "game_event", event: { type: "x" } }, content)).toThrow(EngineError);
  });

  it("unknown evidence target throws EngineError", () => {
    const content = loadBundle();
    content.case.triggers = [alwaysTrigger("t", [{ type: "discover_evidence", evidenceId: "evidence_nope" }])];
    expect(() => step(empty(), { kind: "game_event", event: { type: "x" } }, content)).toThrow(EngineError);
  });

  it("unknown asset target throws EngineError", () => {
    const content = loadBundle();
    content.case.triggers = [alwaysTrigger("t", [{ type: "play_audio_cue", assetId: "asset_nope" }])];
    expect(() => step(empty(), { kind: "game_event", event: { type: "x" } }, content)).toThrow(EngineError);
  });

  it("application and notification targets are not existence-checked", () => {
    const content = loadBundle();
    content.case.triggers = [
      alwaysTrigger("t", [
        { type: "unlock_application", applicationId: "app_anything" },
        { type: "show_notification", notificationId: "notif_anything" },
      ]),
    ];
    const result = step(empty(), { kind: "game_event", event: { type: "x" } }, content);
    expect(result.state.unlockedApplications).toEqual(["app_anything"]);
    expect(result.state.notifications).toEqual(["notif_anything"]);
  });
});

describe("appliedEffects trace", () => {
  it("includes idempotent no-op effects", () => {
    const content = loadBundle();
    content.case.triggers = [alwaysTrigger("t", [{ type: "unlock_record", recordId: "record_test" }])];
    const first = step(empty(), { kind: "game_event", event: { type: "x" } }, content);
    const second = step(first.state, { kind: "game_event", event: { type: "y" } }, content);
    expect(second.appliedEffects).toEqual([{ type: "unlock_record", recordId: "record_test" }]);
  });

  it("sets a flag to the same value and still records it", () => {
    const content = loadBundle();
    content.case.triggers = [alwaysTrigger("t", [flagEffect("k", 1)])];
    const first = step(empty(), { kind: "game_event", event: { type: "x" } }, content);
    const second = step(first.state, { kind: "game_event", event: { type: "y" } }, content);
    expect(second.appliedEffects).toEqual([{ type: "set_flag", key: "k", value: 1 }]);
  });

  it("choice effects precede trigger effects", () => {
    const content = loadBundle();
    content.dialogue[0]!.choices![0]!.consequences = [flagEffect("choice", true)];
    content.case.triggers = [alwaysTrigger("t", [flagEffect("trigger", true)])];
    const result = step(empty(), { kind: "dialogue_choice_selected", choiceId: "choice_test" }, content);
    expect(result.appliedEffects.map((effect) => ("key" in effect ? effect.key : ""))).toEqual(["choice", "trigger"]);
  });
});

describe("rule integration across steps", () => {
  it("eventOccurred rules see history from prior steps", () => {
    const content = loadBundle();
    content.case.triggers = [
      alwaysTrigger("t_ev", [flagEffect("seen", true)], { rule: { eventOccurred: { type: "search_performed" } } }),
    ];
    const first = step(empty(), { kind: "game_event", event: { type: "record_opened" } }, content);
    expect(first.state.flags).toEqual({});
    const second = step(first.state, { kind: "game_event", event: { type: "search_performed" } }, content);
    expect(second.state.flags).toEqual({ seen: true });
  });

  it("countAtLeast counts events across steps", () => {
    const content = loadBundle();
    content.case.triggers = [
      alwaysTrigger("t_count", [flagEffect("reached", true)], {
        rule: { countAtLeast: { eventType: "search_performed", count: 2 } },
      }),
    ];
    const first = step(empty(), { kind: "game_event", event: { type: "search_performed" } }, content);
    expect(first.state.flags).toEqual({});
    const second = step(first.state, { kind: "game_event", event: { type: "search_performed" } }, content);
    expect(second.state.flags).toEqual({ reached: true });
  });

  it("objectiveCompleted projection derives from completed state", () => {
    const content = loadBundle();
    content.case.triggers = [
      alwaysTrigger("t_complete", [{ type: "complete_objective", objectiveId: "objective_test" }]),
      alwaysTrigger("t_check", [flagEffect("done", true)], {
        rule: { objectiveCompleted: "objective_test" },
      }),
    ];
    const result = step(empty(), { kind: "game_event", event: { type: "x" } }, content);
    expect(result.state.completedObjectives).toEqual(["objective_test"]);
    expect(result.state.flags).toEqual({ done: true });
  });

  it("entityDiscovered projection derives from discoveredEntityIds", () => {
    const content = loadBundle();
    content.case.triggers = [
      alwaysTrigger("t_discover", [{ type: "discover_evidence", evidenceId: "evidence_test" }]),
      alwaysTrigger("t_check", [flagEffect("found", true)], {
        rule: { entityDiscovered: "evidence_test" },
      }),
    ];
    const result = step(empty(), { kind: "game_event", event: { type: "x" } }, content);
    expect(result.state.flags).toEqual({ found: true });
  });

  it("choiceSelected projection derives from selected choices", () => {
    const content = loadBundle();
    content.case.triggers = [
      alwaysTrigger("t_check", [flagEffect("chosen_flag", true)], {
        rule: { choiceSelected: "choice_test" },
      }),
    ];
    const result = step(empty(), { kind: "dialogue_choice_selected", choiceId: "choice_test" }, content);
    expect(result.state.flags).toEqual({ chosen_flag: true });
  });
});

describe("determinism and immutability", () => {
  it("same state + input + content returns identical results repeatedly", () => {
    const content = loadBundle();
    content.case.triggers = [
      alwaysTrigger("t_a", [flagEffect("a", true)], { priority: 2 }),
      alwaysTrigger("t_b", [flagEffect("b", true)], { priority: 1 }),
    ];
    const input: EngineInput = { kind: "dialogue_choice_selected", choiceId: "choice_test" };
    const first = step(empty(), input, content);
    for (let i = 0; i < 10; i++) {
      expect(step(empty(), input, content)).toEqual(first);
    }
  });

  it("does not mutate the input state, event, or content", () => {
    const content = loadBundle();
    content.case.triggers = [alwaysTrigger("t", [flagEffect("a", true)])];
    const input: EngineInput = { kind: "game_event", event: { type: "x", entityId: "y" } };
    const state = empty();
    const beforeState = JSON.stringify(state);
    const beforeInput = JSON.stringify(input);
    const beforeContent = JSON.stringify(content);
    step(state, input, content);
    expect(JSON.stringify(state)).toBe(beforeState);
    expect(JSON.stringify(input)).toBe(beforeInput);
    expect(JSON.stringify(content)).toBe(beforeContent);
  });
});
