import type {
  AssetDefinition,
  CharacterDefinition,
  DialogueChoice,
  DialogueNode,
  EvidenceDefinition,
} from "../../content/schemas";
import type { ContentBundle } from "../../content/validator";
import type { CaseEngineState } from "../../domain/engine";

type Asset = AssetDefinition;
type Character = CharacterDefinition;
type Evidence = EvidenceDefinition;

export interface AttachmentViewModel {
  readonly assetId: string;
  readonly assetType: Asset["type"];
  /** Raw authored alt text; null when unauthored (the component localizes the fallback label). */
  readonly altText: string | null;
  readonly hasTranscript: boolean;
  readonly evidenceIds: readonly string[];
}

export interface ChoiceViewModel {
  readonly choiceId: string;
  readonly label: string;
}

export interface MailRowViewModel {
  readonly nodeId: string;
  /** Character displayName; null when the speaker cannot be resolved (the component localizes the fallback). */
  readonly senderLabel: string | null;
  readonly body: string;
  readonly time: string | null;
  readonly isUnread: boolean;
}

export interface MailDetailViewModel extends Omit<MailRowViewModel, "isUnread"> {
  readonly attachments: readonly AttachmentViewModel[];
  readonly choices: readonly ChoiceViewModel[];
}

export type MailInboxState =
  | { kind: "no-session" }
  | { kind: "empty" }
  | { kind: "ok"; rows: readonly MailRowViewModel[]; detail: MailDetailViewModel | null };

export interface MailViewModelInput {
  readonly content: ContentBundle;
  readonly state: CaseEngineState;
  readonly mailChannelId: string;
  readonly readMessageIds: ReadonlySet<string>;
  readonly selectedNodeId: string | null;
}

function getIndexedMaps(content: ContentBundle) {
  return {
    dialogue: new Map(content.dialogue.map((node) => [node.id, node])),
    characters: new Map(content.characters.map((character) => [character.id, character])),
    assets: new Map(content.assets.map((asset) => [asset.id, asset])),
  };
}

/**
 * Projects CaseEngineState.queuedDialogue into the Mail inbox. Deterministic:
 * queue order is authoritative; nodes belonging to other channels are skipped;
 * unresolvable queued IDs are skipped defensively; repeated queued ids are
 * preserved as-is.
 */
export function buildMailInbox(input: MailViewModelInput): MailInboxState {
  const maps = getIndexedMaps(input.content);
  const rows: MailRowViewModel[] = [];

  for (const nodeId of input.state.queuedDialogue) {
    const node = maps.dialogue.get(nodeId);
    if (!node) continue;
    if (node.channelId !== input.mailChannelId) continue;

    rows.push(
      toRow(node, maps.characters.get(node.speakerId), input.readMessageIds),
    );
  }

  if (rows.length === 0) {
    return { kind: "empty" };
  }

  const detail = input.selectedNodeId === null ? null : buildDetail(input.selectedNodeId, input.content, maps);

  return { kind: "ok", rows, detail };
}

function toRow(
  node: DialogueNode,
  sender: Character | undefined,
  readMessageIds: ReadonlySet<string>,
): MailRowViewModel {
  return {
    nodeId: node.id,
    senderLabel: sender?.displayName ?? null,
    body: node.text,
    time: node.sentAtNarrativeTime ?? null,
    isUnread: !readMessageIds.has(node.id),
  };
}

function buildDetail(
  nodeId: string,
  content: ContentBundle,
  maps: ReturnType<typeof getIndexedMaps>,
): MailDetailViewModel | null {
  const node = maps.dialogue.get(nodeId);
  if (!node) return null;

  const sender = maps.characters.get(node.speakerId);

  const attachments: AttachmentViewModel[] = (node.attachments ?? [])
    .map((assetId) => {
      const asset = maps.assets.get(assetId);
      if (!asset) return null;
      return attachmentToViewModel(asset, content.evidence);
    })
    .filter((entry): entry is AttachmentViewModel => entry !== null);

  const choices: ChoiceViewModel[] = (node.choices ?? []).map((choice: DialogueChoice) => ({
    choiceId: choice.id,
    label: choice.label,
  }));

  return {
    nodeId: node.id,
    senderLabel: sender?.displayName ?? null,
    body: node.text,
    time: node.sentAtNarrativeTime ?? null,
    attachments,
    choices,
  };
}

function attachmentToViewModel(asset: Asset, evidence: readonly Evidence[]): AttachmentViewModel {
  const alt = asset.altText?.trim();

  const evidenceIds = evidence
    .filter((candidate) => candidate.assetIds.includes(asset.id))
    .map((candidate) => candidate.id);

  return {
    assetId: asset.id,
    assetType: asset.type,
    altText: alt && alt.length > 0 ? alt : null,
    hasTranscript: asset.transcriptPath !== undefined,
    evidenceIds,
  };
}

/**
 * User-visible evidence status: true only when every evidence id linked to the
 * attachment is present in the authoritative engine state. No discovery state
 * is tracked outside engine state.
 */
export function isEvidenceDiscovered(
  evidenceIds: readonly string[],
  state: CaseEngineState,
): boolean {
  return evidenceIds.length > 0 && evidenceIds.every((id) => state.discoveredEntityIds.includes(id));
}
