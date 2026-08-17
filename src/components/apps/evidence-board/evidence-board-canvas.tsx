"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { Background, Controls, Handle, Position, ReactFlow, useReactFlow } from "@xyflow/react";
import type { Connection, Edge, Node, NodeChange, NodeMouseHandler, NodeProps, OnNodeDrag } from "@xyflow/react";
import { projectEvidenceBoardEdges, projectEvidenceBoardNodes } from "@/features/evidence-board/evidence-board-react-flow-adapter";
import { useEvidenceBoard } from "@/features/evidence-board/evidence-board-provider";
import { useOptionalCaseSession } from "@/features/session/case-session";
import type { EvidenceFlowNodeData } from "@/features/evidence-board/evidence-board-react-flow-adapter";
import { EvidenceVisual, EVIDENCE_VISUAL_IDS } from "@/components/evidence";
import type { EvidenceVisualId } from "@/components/evidence";

function isEvidenceVisualId(value: string): value is EvidenceVisualId {
  return (EVIDENCE_VISUAL_IDS as readonly string[]).includes(value);
}

export function BoardNode({ data }: NodeProps<Node<EvidenceFlowNodeData>>) {
  return (
    <article className={`bbx-evidence-node bbx-evidence-node-${data.kind}`}>
      <Handle type="target" position={Position.Left} />
      {data.kind === "evidence" && data.evidenceId !== undefined && isEvidenceVisualId(data.evidenceId) ? (
        <EvidenceVisual
          evidenceId={data.evidenceId}
          className="mb-1 h-6 w-6 text-bbx-text-2"
        />
      ) : null}
      <strong>{data.title}</strong>
      <p>{data.detail}</p>
      {data.source ? <small>{data.source}</small> : null}
      <Handle type="source" position={Position.Right} />
    </article>
  );
}

const nodeTypes = { evidence: BoardNode, note: BoardNode };

interface Props {
  readonly onSelectNode: (id: string | null) => void;
  readonly onSelectEdge: (id: string | null) => void;
  readonly onReady: (createPosition: () => { x: number; y: number }) => void;
}

interface CanvasBounds {
  readonly left: number;
  readonly top: number;
  readonly width: number;
  readonly height: number;
}

export function getNextNotePosition(
  bounds: CanvasBounds | undefined,
  screenToFlowPosition: (position: { x: number; y: number }) => { x: number; y: number },
  viewport: { x: number; y: number; zoom: number },
  ordinal: number,
): { x: number; y: number } {
  const offset = { x: (ordinal % 4) * 24, y: Math.floor(ordinal / 4) * 24 };
  const center = bounds !== undefined && bounds.width > 0 && bounds.height > 0
    ? screenToFlowPosition({ x: bounds.left + bounds.width / 2, y: bounds.top + bounds.height / 2 })
    : { x: -viewport.x / viewport.zoom, y: -viewport.y / viewport.zoom };
  const position = { x: center.x + offset.x, y: center.y + offset.y };
  return Number.isFinite(position.x) && Number.isFinite(position.y) ? position : offset;
}

export function applyTransientNodeChanges(
  nodes: readonly Node<EvidenceFlowNodeData>[],
  changes: readonly NodeChange<Node<EvidenceFlowNodeData>>[],
): Node<EvidenceFlowNodeData>[] {
  return nodes.map((node) => {
    const positionChange = changes.find((change) => change.type === "position" && change.id === node.id);
    return positionChange?.type === "position" && positionChange.position !== undefined
      ? { ...node, position: positionChange.position }
      : node;
  });
}

export function EvidenceBoardCanvas({ onSelectNode, onSelectEdge, onReady }: Props) {
  const session = useOptionalCaseSession();
  const { board, createEdge, moveNode } = useEvidenceBoard();
  const wrapperRef = useRef<HTMLDivElement>(null);
  const { screenToFlowPosition, getViewport } = useReactFlow();
  const canonicalNodes = useMemo(() => session === null ? [] : projectEvidenceBoardNodes(board, session.content), [board, session]);
  const edges = useMemo(() => projectEvidenceBoardEdges(board), [board]);
  const [nodes, setNodes] = useState(canonicalNodes);
  const draggingRef = useRef(false);

  useEffect(() => {
    if (!draggingRef.current) setNodes(canonicalNodes);
  }, [canonicalNodes]);

  useEffect(() => {
    onReady(() => {
      const bounds = wrapperRef.current?.getBoundingClientRect();
      const ordinal = board.nextNoteSequence;
      return getNextNotePosition(bounds, screenToFlowPosition, getViewport(), ordinal);
    });
  }, [board.nextNoteSequence, getViewport, onReady, screenToFlowPosition]);

  const onNodesChange = (changes: NodeChange<Node<EvidenceFlowNodeData>>[]) => {
    setNodes((previous) => applyTransientNodeChanges(previous, changes));
  };

  return <div ref={wrapperRef} className="bbx-evidence-canvas relative min-h-80 flex-1">
    <ReactFlow
      nodes={nodes}
      edges={edges}
      nodeTypes={nodeTypes}
      onNodesChange={onNodesChange}
      onConnect={(connection: Connection) => { if (connection.source && connection.target) createEdge(connection.source, connection.target); }}
      onNodeDragStart={() => { draggingRef.current = true; }}
      onNodeDragStop={((_, node) => { draggingRef.current = false; moveNode(node.id, node.position); }) as OnNodeDrag<Node<EvidenceFlowNodeData>>}
      onNodeClick={((_, node) => onSelectNode(node.id)) as NodeMouseHandler<Node<EvidenceFlowNodeData>>}
      onEdgeClick={((_, edge) => onSelectEdge(edge.id)) as ((event: React.MouseEvent, edge: Edge) => void)}
      edgesFocusable
      deleteKeyCode={null}
      fitView
    >
      <Background gap={24} size={1} />
      <Controls showInteractive={false} />
    </ReactFlow>
  </div>;
}
