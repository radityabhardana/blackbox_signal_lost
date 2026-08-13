"use client";

import { createContext, useContext, useEffect, useRef, useState } from "react";
import type { ReactNode } from "react";
import {
  createEvidenceBoardNote,
  createEvidenceBoardPlayerEdge,
  createInitialEvidenceBoardState,
  moveEvidenceBoardNode,
  removeEvidenceBoardNote,
  removeEvidenceBoardPlayerEdge,
  syncDiscoveredEvidence,
  updateEvidenceBoardNote,
} from "@/domain/evidence-board";
import type { EvidenceBoardPosition, EvidenceBoardState } from "@/domain/evidence-board";
import { useOptionalCaseSession } from "@/features/session/case-session";

export interface EvidenceBoardContextValue {
  readonly board: EvidenceBoardState;
  createNote(text: string, position: EvidenceBoardPosition): void;
  updateNote(noteId: string, text: string): void;
  removeNote(noteId: string): void;
  createEdge(sourceNodeId: string, targetNodeId: string): void;
  removeEdge(edgeId: string): void;
  moveNode(nodeId: string, position: EvidenceBoardPosition): void;
}

const EvidenceBoardContext = createContext<EvidenceBoardContextValue | null>(null);

/** Workspace-lifetime, non-persistent owner for committed A1 board state. */
export function EvidenceBoardProvider({ children }: { children: ReactNode }) {
  const session = useOptionalCaseSession();
  const [board, setBoard] = useState<EvidenceBoardState>(createInitialEvidenceBoardState);
  const sessionIdentityRef = useRef<{ caseId: string; content: NonNullable<typeof session>["content"] } | null>(null);
  const caseId = session?.content.case.id ?? null;

  useEffect(() => {
    const previousIdentity = sessionIdentityRef.current;
    const sessionChanged = session === null
      ? previousIdentity !== null
      : previousIdentity === null || previousIdentity.caseId !== caseId || previousIdentity.content !== session.content;
    if (sessionChanged) {
      sessionIdentityRef.current = session === null ? null : { caseId: session.content.case.id, content: session.content };
      setBoard(session === null
        ? createInitialEvidenceBoardState()
        : syncDiscoveredEvidence(createInitialEvidenceBoardState(), session.content, session.state.discoveredEntityIds));
      return;
    }
    if (session !== null) {
      // Case-session discovery is an external source; reconcile it after commits.
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setBoard((previous) => syncDiscoveredEvidence(previous, session.content, session.state.discoveredEntityIds));
    }
  }, [caseId, session]);

  const value: EvidenceBoardContextValue = {
    board,
    createNote: (text, position) => setBoard((previous) => createEvidenceBoardNote(previous, text, position)),
    updateNote: (noteId, text) => setBoard((previous) => updateEvidenceBoardNote(previous, noteId, text)),
    removeNote: (noteId) => setBoard((previous) => removeEvidenceBoardNote(previous, noteId)),
    createEdge: (sourceNodeId, targetNodeId) => setBoard((previous) => createEvidenceBoardPlayerEdge(previous, sourceNodeId, targetNodeId)),
    removeEdge: (edgeId) => setBoard((previous) => removeEvidenceBoardPlayerEdge(previous, edgeId)),
    moveNode: (nodeId, position) => setBoard((previous) => moveEvidenceBoardNode(previous, nodeId, position)),
  };

  return <EvidenceBoardContext.Provider value={value}>{children}</EvidenceBoardContext.Provider>;
}

export function useEvidenceBoard(): EvidenceBoardContextValue {
  const context = useContext(EvidenceBoardContext);
  if (context === null) throw new Error("useEvidenceBoard requires EvidenceBoardProvider");
  return context;
}
