import type { Edge, Node } from "@xyflow/react";
import { evidenceNodeId } from "@/domain/evidence-board";
import type { EvidenceBoardState } from "@/domain/evidence-board";
import type { ContentBundle } from "@/content/validator";

export interface EvidenceFlowNodeData extends Record<string, unknown> {
  readonly kind: "evidence" | "note";
  readonly title: string;
  readonly detail: string;
  readonly source?: string;
  readonly tags?: readonly string[];
}

export function projectEvidenceBoardNodes(board: EvidenceBoardState, content: ContentBundle): Node<EvidenceFlowNodeData>[] {
  const evidenceById = new Map(content.evidence.map((evidence) => [evidence.id, evidence]));
  const evidenceNodes: Node<EvidenceFlowNodeData>[] = board.evidenceNodes.flatMap((node) => {
    const evidence = evidenceById.get(node.evidenceId);
    if (evidence === undefined) return [];
    return [{
      id: evidenceNodeId(node.evidenceId),
      type: "evidence",
      position: node.position,
      data: {
        kind: "evidence",
        title: evidence.title,
        detail: `${evidence.type}: ${evidence.summary}`,
        source: evidence.source.system ?? evidence.source.organizationId ?? "Unknown source",
        tags: evidence.tags,
      },
    }];
  });
  const noteNodes: Node<EvidenceFlowNodeData>[] = board.noteNodes.map((node) => ({
    id: node.id,
    type: "note",
    position: node.position,
    data: { kind: "note", title: "Private note", detail: node.text },
  }));
  return [...evidenceNodes, ...noteNodes];
}

export function projectEvidenceBoardEdges(board: EvidenceBoardState): Edge[] {
  return board.edges.map((edge) => ({
    id: edge.id,
    source: edge.sourceNodeId,
    target: edge.targetNodeId,
    label: "Player hypothesis",
    type: "straight",
    deletable: false,
  }));
}
