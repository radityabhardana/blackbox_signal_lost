"use client";

import { useEffect, useMemo, useState } from "react";
import { ReactFlowProvider } from "@xyflow/react";
import { evidenceNodeId, isNoteNodeId } from "@/domain/evidence-board";
import { useEvidenceBoard } from "@/features/evidence-board/evidence-board-provider";
import { useOptionalCaseSession } from "@/features/session/case-session";
import { EvidenceBoardCanvas } from "./evidence-board-canvas";
import { EvidenceBoardList } from "./evidence-board-list";

export function EvidenceBoardApp() {
  const session = useOptionalCaseSession();
  const { board, createNote, updateNote, removeNote, createEdge, removeEdge, moveNode } = useEvidenceBoard();
  const [selectedNodeId, setSelectedNodeId] = useState<string | null>(null);
  const [selectedEdgeId, setSelectedEdgeId] = useState<string | null>(null);
  const [newNoteText, setNewNoteText] = useState("");
  const [noteText, setNoteText] = useState("");
  const [targetNodeId, setTargetNodeId] = useState("");
  const [notePosition, setNotePosition] = useState<(() => { x: number; y: number }) | null>(null);
  const nodeIds = useMemo(() => [
    ...board.evidenceNodes.map((node) => evidenceNodeId(node.evidenceId)),
    ...board.noteNodes.map((node) => node.id),
  ], [board.evidenceNodes, board.noteNodes]);

  const activeSelectedNodeId = selectedNodeId !== null && nodeIds.includes(selectedNodeId) ? selectedNodeId : null;
  const activeSelectedEdgeId = selectedEdgeId !== null && board.edges.some((edge) => edge.id === selectedEdgeId) ? selectedEdgeId : null;
  const selectedNote = activeSelectedNodeId !== null && isNoteNodeId(activeSelectedNodeId)
    ? board.noteNodes.find((note) => note.id === activeSelectedNodeId) ?? null
    : null;
  const selectedNode = activeSelectedNodeId === null ? null : [
    ...board.evidenceNodes.map((node) => ({ id: evidenceNodeId(node.evidenceId), position: node.position })),
    ...board.noteNodes.map((node) => ({ id: node.id, position: node.position })),
  ].find((node) => node.id === activeSelectedNodeId) ?? null;

  useEffect(() => {
    if (selectedNodeId !== null && !nodeIds.includes(selectedNodeId)) {
      // Committed board reconciliation can remove a selected node outside this app.
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setSelectedNodeId(null);
    }
    if (selectedEdgeId !== null && !board.edges.some((edge) => edge.id === selectedEdgeId)) {
      // Incident edge cleanup and explicit removal share the same local cleanup path.
      setSelectedEdgeId(null);
    }
  }, [board.edges, nodeIds, selectedEdgeId, selectedNodeId]);

  const selectNode = (id: string | null) => {
    setSelectedNodeId(id);
    setSelectedEdgeId(null);
    setNoteText(id !== null && isNoteNodeId(id) ? board.noteNodes.find((note) => note.id === id)?.text ?? "" : "");
  };

  if (session === null) {
    return <div role="region" aria-label="Evidence Board" className="p-6"><p className="font-mono text-xs uppercase tracking-widest text-bbx-text-2">No active case</p></div>;
  }

  const addNote = () => {
    createNote(newNoteText, notePosition?.() ?? { x: 0, y: 0 });
    setNewNoteText("");
  };
  const connect = () => {
    if (activeSelectedNodeId !== null && targetNodeId !== "") createEdge(activeSelectedNodeId, targetNodeId);
  };

  return <ReactFlowProvider>
    <div role="region" aria-label="Evidence Board" className="bbx-evidence-board flex h-full min-h-0 flex-col">
      <header className="px-4 pt-3 pb-2"><h2 className="font-mono text-xs uppercase tracking-widest text-bbx-text-1">Evidence Board</h2></header>
      {board.evidenceNodes.length === 0 ? <p className="px-4 pb-3 font-mono text-xs text-bbx-text-2">No discovered evidence</p> : null}
        <div className="flex flex-wrap gap-2 px-4 pb-2">
          <label className="sr-only" htmlFor="new-private-note">New private note</label>
          <textarea id="new-private-note" value={newNoteText} onChange={(event) => setNewNoteText(event.target.value)} placeholder="Private note" className="min-h-10 flex-1 border border-bbx-surface-2 bg-bbx-bg-0 px-2 py-1 text-sm" />
          <button type="button" onClick={addNote} className="bbx-btn">Add private note</button>
        </div>
        <EvidenceBoardCanvas onSelectNode={selectNode} onSelectEdge={(id) => { setSelectedEdgeId(id); setSelectedNodeId(null); }} onReady={(createPosition) => setNotePosition(() => createPosition)} />
        <EvidenceBoardList board={board} content={session.content} selectedNodeId={activeSelectedNodeId} selectedEdgeId={activeSelectedEdgeId} onSelectNode={selectNode} onSelectEdge={(id) => { setSelectedEdgeId(id); setSelectedNodeId(null); }} />
        {activeSelectedNodeId !== null ? <section aria-label="Selected board node" className="border-t border-bbx-surface-2 p-3">
          <label htmlFor="hypothesis-target" className="font-mono text-[0.625rem] uppercase tracking-widest text-bbx-text-2">Connect selected node</label>
           <div className="mt-1 flex gap-2"><select id="hypothesis-target" value={targetNodeId} onChange={(event) => setTargetNodeId(event.target.value)} className="min-w-0 flex-1 border border-bbx-surface-2 bg-bbx-bg-0 px-2 py-1 text-sm"><option value="">Choose target</option>{nodeIds.filter((id) => id !== activeSelectedNodeId).map((id) => <option key={id} value={id}>{id}</option>)}</select><button type="button" onClick={connect} className="bbx-btn">Create player hypothesis</button></div>
           {selectedNode !== null ? <div role="group" aria-label="Move selected node" className="mt-2 flex gap-2"><button type="button" onClick={() => moveNode(selectedNode.id, { x: selectedNode.position.x - 24, y: selectedNode.position.y })} className="bbx-btn">Move left</button><button type="button" onClick={() => moveNode(selectedNode.id, { x: selectedNode.position.x + 24, y: selectedNode.position.y })} className="bbx-btn">Move right</button><button type="button" onClick={() => moveNode(selectedNode.id, { x: selectedNode.position.x, y: selectedNode.position.y - 24 })} className="bbx-btn">Move up</button><button type="button" onClick={() => moveNode(selectedNode.id, { x: selectedNode.position.x, y: selectedNode.position.y + 24 })} className="bbx-btn">Move down</button></div> : null}
           {selectedNote !== null ? <div className="mt-2 flex gap-2"><textarea aria-label="Edit private note" value={noteText} onChange={(event) => setNoteText(event.target.value)} className="min-h-10 flex-1 border border-bbx-surface-2 bg-bbx-bg-0 px-2 py-1 text-sm" /><button type="button" onClick={() => updateNote(selectedNote.id, noteText)} className="bbx-btn">Save note</button><button type="button" onClick={() => { removeNote(selectedNote.id); selectNode(null); }} className="bbx-btn">Delete note</button></div> : null}
         </section> : null}
        {activeSelectedEdgeId !== null ? <section aria-label="Selected player hypothesis" className="border-t border-bbx-surface-2 p-3"><p className="font-mono text-xs text-bbx-text-2">Player hypothesis</p><button type="button" onClick={() => { removeEdge(activeSelectedEdgeId); setSelectedEdgeId(null); }} className="bbx-btn mt-2">Remove player hypothesis</button></section> : null}
    </div>
  </ReactFlowProvider>;
}
