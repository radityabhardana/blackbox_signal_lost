import { contentBundleSchema } from "@/content/validator";
import type { ContentBundle } from "@/content/validator";
import { createInitialEngineState, stepCaseEngine } from "@/domain/engine";
import type { CaseEngineState } from "@/domain/engine";
import type { DialogueChoice, DialogueNode, TriggerDefinition } from "@/content/schemas";
import bundleJson from "@/content/fixtures/bundles/valid/bundle_basic_valid.json";

export interface MessengerTestSessionFixture {
  readonly content: ContentBundle;
  readonly messengerChannelId: "channel_messenger";
  readonly initialState: CaseEngineState;
}

/**
 * Synthetic Messenger test content. Test-harness only: parses a deep clone of
 * the neutral valid bundle (the canonical file itself is never modified —
 * BBX-040 previously added trigger_mail_test to it, and BBX-042 adds nothing
 * more), augments the clone with a messenger channel, and boots the real
 * BBX-022 engine with a `messenger_test_bootstrap` event so queuedDialogue
 * contains the authored greeting while evidence_test stays undiscovered.
 * queuedDialogue is engine-written only; it is never mutated directly.
 */
export function createMessengerTestSession(): MessengerTestSessionFixture {
  const content = contentBundleSchema.parse(augmentContent(bundleJson));

  const afterBootstrap = stepCaseEngine(
    createInitialEngineState(),
    { kind: "game_event", event: { type: "messenger_test_bootstrap" } },
    content,
  );

  return {
    content,
    messengerChannelId: "channel_messenger",
    initialState: afterBootstrap.state,
  };
}

function augmentContent(raw: unknown): unknown {
  const bundle = raw as { case: { triggers: unknown[] }; dialogue: unknown[] };
  return {
    ...bundle,
    case: { ...bundle.case, triggers: [...bundle.case.triggers, MESSENGER_TRIGGER] },
    dialogue: [...bundle.dialogue, GREETING_NODE, REPLY_NODE],
  };
}

const MESSENGER_TRIGGER: TriggerDefinition = {
  id: "trigger_messenger_test",
  once: true,
  priority: 1,
  rule: { eventOccurred: { type: "messenger_test_bootstrap" } },
  effects: [{ type: "queue_dialogue", nodeId: "dialogue_messenger_greeting" }],
};

const CONFIRM_CHOICE: DialogueChoice = {
  id: "choice_messenger_confirm",
  label: "Acknowledge — continue",
  consequences: [{ type: "queue_dialogue", nodeId: "dialogue_messenger_reply" }],
  nextNodeId: "dialogue_messenger_reply",
};

const GREETING_NODE: DialogueNode = {
  id: "dialogue_messenger_greeting",
  channelId: "channel_messenger",
  speakerId: "character_test",
  text: "First test message.",
  enterRule: { always: true },
  choices: [CONFIRM_CHOICE],
};

const REPLY_NODE: DialogueNode = {
  id: "dialogue_messenger_reply",
  channelId: "channel_messenger",
  speakerId: "character_test",
  text: "Reply acknowledged.",
  enterRule: { always: true },
};