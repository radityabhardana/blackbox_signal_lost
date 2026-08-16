import type { DialogueChoice, DialogueNode } from "../../content/schemas";
import type { ContentBundle } from "../../content/validator";
import type { CaseEngineState } from "../../domain/engine";

export interface MessengerChoiceViewModel {
  readonly choiceId: string;
  readonly label: string;
}

export interface MessengerMessageViewModel {
  readonly nodeId: string;
  readonly senderLabel: string;
  readonly body: string;
  readonly time: string | null;
  readonly choices: readonly MessengerChoiceViewModel[];
  /** true when any choice of this node is in state.selectedChoices (ADR-023) */
  readonly choicesResolved: boolean;
}

export type MessengerViewState =
  | { kind: "no-session" }
  | { kind: "empty" }
  | { kind: "ok"; messages: readonly MessengerMessageViewModel[] };

export interface MessengerViewModelInput {
  readonly content: ContentBundle;
  readonly state: CaseEngineState;
  readonly messengerChannelId: string | undefined;
}

/**
 * Projects CaseEngineState.queuedDialogue into the Messenger thread. Deterministic:
 * queue order is authoritative; an unconfigured channel is the honest empty
 * state (never a fallback channel); nodes belonging to other channels are
 * skipped; unresolvable queued IDs are skipped defensively; repeated queued
 * ids are preserved as-is. DialogueNode.enterRule is never read here — the
 * engine's trigger system is the only authored dialogue-gating mechanism.
 */
export function buildMessengerView(input: MessengerViewModelInput): MessengerViewState {
  if (input.messengerChannelId === undefined) {
    return { kind: "empty" };
  }

  const dialogue = new Map(input.content.dialogue.map((node: DialogueNode) => [node.id, node]));
  const characters = new Map(input.content.characters.map((character) => [character.id, character]));

  const messages: MessengerMessageViewModel[] = [];

  for (const nodeId of input.state.queuedDialogue) {
    const node = dialogue.get(nodeId);
    if (!node) continue;
    if (node.channelId !== input.messengerChannelId) continue;

    const nodeChoiceIds = node.choices?.map((choice) => choice.id) ?? [];
    const choicesResolved = nodeChoiceIds.some((id) => input.state.selectedChoices.includes(id));

    messages.push({
      nodeId: node.id,
      senderLabel: characters.get(node.speakerId)?.displayName ?? "Unknown sender",
      body: node.text,
      time: node.sentAtNarrativeTime ?? null,
      choices: (node.choices ?? []).map((choice: DialogueChoice) => ({
        choiceId: choice.id,
        label: choice.label,
      })),
      choicesResolved,
    });
  }

  if (messages.length === 0) {
    return { kind: "empty" };
  }

  return { kind: "ok", messages };
}
