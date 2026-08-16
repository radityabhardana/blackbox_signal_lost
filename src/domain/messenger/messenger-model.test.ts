import { describe, expect, it } from "vitest";

import { createInitialEngineState } from "../engine";
import type { CaseEngineState } from "../engine";
import { createMessengerTestSession } from "../../test/fixtures/messenger-content";
import type { ContentBundle } from "../../content/validator";
import { contentBundleSchema } from "../../content/validator";
import type { DialogueNode } from "../../content/schemas";
import { buildMessengerView } from "./messenger-model";

const { content, messengerChannelId } = createMessengerTestSession();

function withQueue(queuedDialogue: readonly string[]): CaseEngineState {
  return { ...createInitialEngineState(), queuedDialogue };
}

/** Parses the fixture content plus extra dialogue nodes (fixture-augmentation pattern). */
function withDialogueNodes(...nodes: DialogueNode[]): ContentBundle {
  return contentBundleSchema.parse({
    ...content,
    dialogue: [...content.dialogue, ...nodes],
  });
}

const THREE_CHOICE_NODE: DialogueNode = {
  id: "dialogue_messenger_branch",
  channelId: "channel_messenger",
  speakerId: "character_test",
  text: "Branch message.",
  enterRule: { always: true },
  choices: [
    { id: "choice_branch_one", label: "Branch one", consequences: [], nextNodeId: "dialogue_messenger_branch" },
    { id: "choice_branch_two", label: "Branch two", consequences: [], nextNodeId: "dialogue_messenger_branch" },
    { id: "choice_branch_three", label: "Branch three", consequences: [], nextNodeId: "dialogue_messenger_branch" },
  ],
};

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
          choicesResolved: false,
        },
        {
          nodeId: "dialogue_messenger_reply",
          senderLabel: "Test Character",
          body: "Reply acknowledged.",
          time: null,
          choices: [],
          choicesResolved: false,
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

  it("marks a message resolved when any of its choices is selected", () => {
    const state: CaseEngineState = {
      ...withQueue(["dialogue_messenger_greeting"]),
      selectedChoices: ["choice_messenger_confirm"],
    };
    const view = buildMessengerView({ content, state, messengerChannelId });

    expect(view.kind).toBe("ok");
    if (view.kind !== "ok") return;
    expect(view.messages[0]?.choicesResolved).toBe(true);
  });

  it("marks a message unresolved when none of its choices is selected", () => {
    const view = buildMessengerView({
      content: withDialogueNodes(THREE_CHOICE_NODE),
      state: withQueue(["dialogue_messenger_branch"]),
      messengerChannelId,
    });

    expect(view.kind).toBe("ok");
    if (view.kind !== "ok") return;
    expect(view.messages[0]?.choices).toHaveLength(3);
    expect(view.messages[0]?.choicesResolved).toBe(false);
  });

  it("a node with no choices is never resolved", () => {
    const state: CaseEngineState = {
      ...withQueue(["dialogue_messenger_reply"]),
      selectedChoices: ["choice_messenger_confirm"],
    };
    const view = buildMessengerView({ content, state, messengerChannelId });

    expect(view.kind).toBe("ok");
    if (view.kind !== "ok") return;
    expect(view.messages[0]?.choices).toHaveLength(0);
    expect(view.messages[0]?.choicesResolved).toBe(false);
  });

  it("resolution is per-node, not global", () => {
    const state: CaseEngineState = {
      ...withQueue(["dialogue_messenger_greeting", "dialogue_messenger_branch"]),
      selectedChoices: ["choice_messenger_confirm"],
    };
    const view = buildMessengerView({
      content: withDialogueNodes(THREE_CHOICE_NODE),
      state,
      messengerChannelId,
    });

    expect(view.kind).toBe("ok");
    if (view.kind !== "ok") return;
    expect(view.messages[0]?.nodeId).toBe("dialogue_messenger_greeting");
    expect(view.messages[0]?.choicesResolved).toBe(true);
    expect(view.messages[1]?.nodeId).toBe("dialogue_messenger_branch");
    expect(view.messages[1]?.choicesResolved).toBe(false);
  });
});
