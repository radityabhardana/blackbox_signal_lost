import type { Edge, Node } from "@xyflow/react";
import { evidenceNodeId } from "@/domain/evidence-board";
import type { EvidenceBoardState } from "@/domain/evidence-board";
import type { ContentBundle } from "@/content/validator";

/**
 * Evidence-flow node data carries raw content ids and authored prose only —
 * display strings are resolved at the React boundary from the locale
 * dictionary (see evidence-board-canvas.tsx BoardNode).
 */
export interface EvidenceFlowEvidenceNodeData extends Record<string, unknown> {
  readonly kind: "evidence";
  readonly title: string;
  readonly summary: string;
  /** Raw evidence type enum value for `evidenceTypeLabel` lookup. */
  readonly evidenceType: string;
  /** Raw source system/organization id; absent when the evidence has no source. */
  readonly source?: string;
  readonly tags: readonly string[];
  readonly evidenceId: string;
}

export interface EvidenceFlowNoteNodeData extends Record<string, unknown> {
  readonly kind: "note";
  readonly text: string;
}

export type EvidenceFlowNodeData = EvidenceFlowEvidenceNodeData | EvidenceFlowNoteNodeData;

export function projectEvidenceBoardNodes(board: EvidenceBoardState, content: ContentBundle): Node<EvidenceFlowNodeData>[] {
  const evidenceById = new Map(content.evidence.map((evidence) => [evidence.id, evidence]));
  const evidenceNodes: Node<EvidenceFlowNodeData>[] = board.evidenceNodes.flatMap((node) => {
    const evidence = evidenceById.get(node.evidenceId);
    if (evidence === undefined) return [];
    const source = evidence.source.system ?? evidence.source.organizationId;
    return [{
      id: evidenceNodeId(node.evidenceId),
      type: "evidence",
      position: node.position,
      data: {
        kind: "evidence",
        title: evidence.title,
        summary: evidence.summary,
        evidenceType: evidence.type,
        ...(source !== undefined ? { source } : {}),
        tags: evidence.tags,
        evidenceId: evidence.id,
      },
    }];
  });
  const noteNodes: Node<EvidenceFlowNodeData>[] = board.noteNodes.map((node) => ({
    id: node.id,
    type: "note",
    position: node.position,
    data: { kind: "note", text: node.text },
  }));
  return [...evidenceNodes, ...noteNodes];
}

export function projectEvidenceBoardEdges(board: EvidenceBoardState): Edge[] {
  return board.edges.map((edge) => ({
    id: edge.id,
    source: edge.sourceNodeId,
    target: edge.targetNodeId,
    type: "straight",
    deletable: false,
  }));
}