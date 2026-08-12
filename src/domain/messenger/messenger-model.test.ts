import { describe, expect, it } from "vitest";

import { createInitialEngineState } from "../engine";
import type { CaseEngineState } from "../engine";
import { createMessengerTestSession } from "../../test/fixtures/messenger-content";
import { buildMessengerView } from "./messenger-model";

const { content, messengerChannelId } = createMessengerTestSession();

function withQueue(queuedDialogue: readonly string[]): CaseEngineState {
  return { ...createInitialEngineState(), queuedDialogue };
}

describe("buildMessengerView", () => {
  it("projects queuedDialogue into message rows in queue order", () => {
    const view = buildMessengerView({
      content,
      state: withQueue(["dialogue_messenger_greeting", "dialogue_messenger_reply"]),
      messengerChannelId,
    });

    expect(view).toEqual({
      kind: "ok",
      messages: [
        {
          nodeId: "dialogue_messenger_greeting",
          senderLabel: "Test Character",
          body: "First test message.",
          time: null,
          choices: [{ choiceId: "choice_messenger_confirm", label: "Acknowledge — continue" }],
        },
        {
          nodeId: "dialogue_messenger_reply",
          senderLabel: "Test Character",
          body: "Reply acknowledged.",
          time: null,
          choices: [],
        },
      ],
    });
  });

  it("skips nodes that belong to other channels", () => {
    const view = buildMessengerView({
      content,
      state: withQueue(["dialogue_test", "dialogue_messenger_greeting"]),
      messengerChannelId,
    });

    expect(view.kind).toBe("ok");
    if (view.kind !== "ok") return;
    expect(view.messages.map((message) => message.nodeId)).toEqual(["dialogue_messenger_greeting"]);
  });

  it("skips unresolvable queued IDs defensively", () => {
    const view = buildMessengerView({
      content,
      state: withQueue(["dialogue_missing", "dialogue_messenger_greeting"]),
      messengerChannelId,
    });

    expect(view.kind).toBe("ok");
    if (view.kind !== "ok") return;
    expect(view.messages.map((message) => message.nodeId)).toEqual(["dialogue_messenger_greeting"]);
  });

  it("preserves duplicate queued ids as separate occurrences", () => {
    const view = buildMessengerView({
      content,
      state: withQueue(["dialogue_messenger_greeting", "dialogue_messenger_greeting"]),
      messengerChannelId,
    });

    expect(view.kind).toBe("ok");
    if (view.kind !== "ok") return;
    expect(view.messages.map((message) => message.nodeId)).toEqual([
      "dialogue_messenger_greeting",
      "dialogue_messenger_greeting",
    ]);
  });

  it("returns empty when no messages are queued for the channel", () => {
    const view = buildMessengerView({
      content,
      state: createInitialEngineState(),
      messengerChannelId,
    });

    expect(view).toEqual({ kind: "empty" });
  });

  it("returns empty when the session has no messengerChannelId, even with queued nodes", () => {
    const view = buildMessengerView({
      content,
      state: withQueue(["dialogue_messenger_greeting"]),
      messengerChannelId: undefined,
    });

    expect(view).toEqual({ kind: "empty" });
  });

  it("falls back to Unknown sender when the speaker cannot be resolved", () => {
    const view = buildMessengerView({
      content,
      state: withQueue(["dialogue_messenger_reply"]),
      messengerChannelId,
    });

    expect(view.kind).toBe("ok");
    if (view.kind !== "ok") return;
    expect(view.messages[0]?.senderLabel).toBe("Test Character");

    const unknownSpeaker = {
      ...content,
      dialogue: content.dialogue.map((node) =>
        node.id === "dialogue_messenger_reply" ? { ...node, speakerId: "character_missing" } : node,
      ),
    };

    const fallbackView = buildMessengerView({
      content: unknownSpeaker,
      state: withQueue(["dialogue_messenger_reply"]),
      messengerChannelId,
    });

    expect(fallbackView.kind).toBe("ok");
    if (fallbackView.kind !== "ok") return;
    expect(fallbackView.messages[0]?.senderLabel).toBe("Unknown sender");
  });
});
