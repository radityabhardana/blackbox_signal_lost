export interface EvidenceBoardPosition {
  readonly x: number;
  readonly y: number;
}

export interface EvidenceBoardEvidenceNode {
  readonly evidenceId: string;
  readonly position: EvidenceBoardPosition;
}

export interface EvidenceBoardNoteNode {
  readonly id: string;
  readonly text: string;
  readonly position: EvidenceBoardPosition;
}

export interface EvidenceBoardPlayerEdge {
  readonly id: string;
  readonly sourceNodeId: string;
  readonly targetNodeId: string;
}

export interface EvidenceBoardState {
  readonly evidenceNodes: readonly EvidenceBoardEvidenceNode[];
  readonly noteNodes: readonly EvidenceBoardNoteNode[];
  readonly edges: readonly EvidenceBoardPlayerEdge[];
  readonly nextNoteSequence: number;
  readonly nextEdgeSequence: number;
}

export interface EvidenceBoardSnapshotV1 extends EvidenceBoardState {
  readonly version: 1;
}
