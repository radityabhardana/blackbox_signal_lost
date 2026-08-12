import { describe, expect, it } from "vitest";

import { validateContentBundle } from "../../content/validator";
import { createInitialEngineState, stepCaseEngine } from "../../domain/engine";
import { buildMessengerView } from "../../domain/messenger";
import { createMessengerTestSession } from "./messenger-content";

describe("messenger-content fixture", () => {
  it("clone parses through contentBundleSchema", () => {
    const { content } = createMessengerTestSession();
    expect(content.case.id).toBe("case_test");
  });

  it("augmented clone passes the BBX-024 content validator", () => {
    const { content } = createMessengerTestSession();
    expect(validateContentBundle(content).success).toBe(true);
  });

  it("bootstrap through the real engine queues exactly the authored greeting", () => {
    const { content, initialState } = createMessengerTestSession();

    expect(initialState.queuedDialogue).toEqual(["dialogue_messenger_greeting"]);

    const direct = stepCaseEngine(
      createInitialEngineState(),
      { kind: "game_event", event: { type: "messenger_test_bootstrap" } },
      content,
    );
    expect(direct.state.queuedDialogue).toEqual(["dialogue_messenger_greeting"]);
    expect(direct.state.discoveredEntityIds).not.toContain("evidence_test");
    expect(direct.state.firedTriggerIds).toContain("trigger_messenger_test");

    // queuedDialogue is readonly engine state — it can only change through
    // stepCaseEngine, never by direct mutation.
    expect(initialState).toEqual(direct.state);
  });

  it("confirms the authored choice via the engine, then queues the reply once", () => {
    const { content, initialState } = createMessengerTestSession();

    const afterConfirm = stepCaseEngine(
      initialState,
      { kind: "dialogue_choice_selected", choiceId: "choice_messenger_confirm" },
      content,
    );
    expect(afterConfirm.state.queuedDialogue).toEqual([
      "dialogue_messenger_greeting",
      "dialogue_messenger_reply",
    ]);

    const second = stepCaseEngine(
      afterConfirm.state,
      { kind: "dialogue_choice_selected", choiceId: "choice_messenger_confirm" },
      content,
    );
    // The engine preserves the duplicate; the UI disabled guard prevents this
    // input from ever being emitted twice (model/component tests cover that).
    expect(second.state.queuedDialogue).toEqual([
      "dialogue_messenger_greeting",
      "dialogue_messenger_reply",
      "dialogue_messenger_reply",
    ]);
  });

  it("Messenger projection never renders a channel_test message", () => {
    const { content, initialState, messengerChannelId } = createMessengerTestSession();

    // Engine-only path: selecting the mail node's choice fires trigger_test,
    // which queues dialogue_test (channel_test) on the same queue.
    const mixed = stepCaseEngine(
      initialState,
      { kind: "dialogue_choice_selected", choiceId: "choice_test" },
      content,
    );
    expect(mixed.state.queuedDialogue).toContain("dialogue_test");
    expect(mixed.state.queuedDialogue).toContain("dialogue_messenger_greeting");

    const view = buildMessengerView({
      content,
      state: mixed.state,
      messengerChannelId,
    });

    expect(view.kind).toBe("ok");
    if (view.kind !== "ok") return;
    expect(view.messages.map((message) => message.nodeId)).toEqual(["dialogue_messenger_greeting"]);
    expect(view.messages.every((message) => message.nodeId !== "dialogue_test")).toBe(true);
  });
});