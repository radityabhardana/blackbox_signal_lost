import type { EvidenceBoardState } from "@/domain/evidence-board";
import type { ContentBundle } from "@/content/validator";
import { evidenceNodeId } from "@/domain/evidence-board";

interface Props {
  readonly board: EvidenceBoardState;
  readonly content: ContentBundle;
  readonly selectedNodeId: string | null;
  readonly selectedEdgeId: string | null;
  readonly onSelectNode: (id: string) => void;
  readonly onSelectEdge: (id: string) => void;
}

export function EvidenceBoardList({ board, content, selectedNodeId, selectedEdgeId, onSelectNode, onSelectEdge }: Props) {
  const evidenceById = new Map(content.evidence.map((evidence) => [evidence.id, evidence]));
  return (
    <section aria-labelledby="board-list-heading" className="border-t border-bbx-surface-2 p-3">
      <h3 id="board-list-heading" className="font-mono text-[0.625rem] uppercase tracking-widest text-bbx-text-2">Board list</h3>
      <ul className="mt-2 space-y-1">
        {board.evidenceNodes.map((node) => {
          const evidence = evidenceById.get(node.evidenceId);
          if (evidence === undefined) return null;
          const id = evidenceNodeId(node.evidenceId);
          return <li key={id}><button type="button" aria-pressed={selectedNodeId === id} onClick={() => onSelectNode(id)} className="bbx-btn w-full justify-start px-2 py-1 text-left normal-case">Evidence: {evidence.title}</button></li>;
        })}
        {board.noteNodes.map((node) => <li key={node.id}><button type="button" aria-pressed={selectedNodeId === node.id} onClick={() => onSelectNode(node.id)} className="bbx-btn w-full justify-start px-2 py-1 text-left normal-case">Note: {node.text}</button></li>)}
      </ul>
      {board.edges.length > 0 ? <ul className="mt-2 space-y-1">{board.edges.map((edge) => <li key={edge.id}><button type="button" aria-pressed={selectedEdgeId === edge.id} onClick={() => onSelectEdge(edge.id)} className="bbx-btn w-full justify-start px-2 py-1 text-left normal-case">Player hypothesis: {edge.sourceNodeId} - {edge.targetNodeId}</button></li>)}</ul> : null}
    </section>
  );
}
