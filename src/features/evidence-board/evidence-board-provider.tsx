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

export interface EvidenceBoardChange {
  readonly kind: "reconciled" | "committed";
  readonly state: EvidenceBoardState;
}

const EvidenceBoardContext = createContext<EvidenceBoardContextValue | null>(null);

/** Workspace-lifetime, non-persistent owner for committed A1 board state. */
export function EvidenceBoardProvider({
  children,
  initialBoard,
  onBoardChange,
}: {
  readonly children: ReactNode;
  readonly initialBoard?: EvidenceBoardState;
  readonly onBoardChange?: (change: EvidenceBoardChange) => void;
}) {
  const session = useOptionalCaseSession();
  const initialState = initialBoard ?? createInitialEvidenceBoardState();
  const [board, setBoard] = useState<EvidenceBoardState>(initialState);
  const boardRef = useRef(initialState);
  const initialBoardRef = useRef(initialBoard);
  const onBoardChangeRef = useRef(onBoardChange);
  const sessionIdentityRef = useRef<{ caseId: string } | null>(null);
  const caseId = session?.content.case.id ?? null;

  useEffect(() => {
    onBoardChangeRef.current = onBoardChange;
  }, [onBoardChange]);

  const commitBoard = (mutate: (current: EvidenceBoardState) => EvidenceBoardState): void => {
    const next = mutate(boardRef.current);
    if (next === boardRef.current) return;
    boardRef.current = next;
    setBoard(next);
    onBoardChangeRef.current?.({ kind: "committed", state: next });
  };

  useEffect(() => {
    const previousIdentity = sessionIdentityRef.current;
    // A same-case content-reference change (e.g. a live locale switch) is NOT a
    // case change: the localized bundle carries identical ids/rules, so the board
    // is reconciled below and player-authored positions/notes/edges are kept.
    const caseChanged = session === null
      ? previousIdentity !== null
      : previousIdentity === null || previousIdentity.caseId !== caseId;
    if (caseChanged) {
      sessionIdentityRef.current = session === null ? null : { caseId: session.content.case.id };
      if (session === null) {
        const next = createInitialEvidenceBoardState();
        boardRef.current = next;
        // eslint-disable-next-line react-hooks/set-state-in-effect
        setBoard(next);
      } else {
        const base = previousIdentity === null
          ? initialBoardRef.current ?? createInitialEvidenceBoardState()
          : createInitialEvidenceBoardState();
        const next = syncDiscoveredEvidence(base, session.content, session.state.discoveredEntityIds);
        boardRef.current = next;
        setBoard(next);
        onBoardChangeRef.current?.({ kind: "reconciled", state: next });
      }
      return;
    }
    if (session !== null) {
      // Case-session discovery is an external source; reconcile it after commits.
      const next = syncDiscoveredEvidence(boardRef.current, session.content, session.state.discoveredEntityIds);
      boardRef.current = next;
      setBoard(next);
      onBoardChangeRef.current?.({ kind: "reconciled", state: next });
    }
  }, [caseId, session]);

  const value: EvidenceBoardContextValue = {
    board,
    createNote: (text, position) => commitBoard((previous) => createEvidenceBoardNote(previous, text, position)),
    updateNote: (noteId, text) => commitBoard((previous) => updateEvidenceBoardNote(previous, noteId, text)),
    removeNote: (noteId) => commitBoard((previous) => removeEvidenceBoardNote(previous, noteId)),
    createEdge: (sourceNodeId, targetNodeId) => commitBoard((previous) => createEvidenceBoardPlayerEdge(previous, sourceNodeId, targetNodeId)),
    removeEdge: (edgeId) => commitBoard((previous) => removeEvidenceBoardPlayerEdge(previous, edgeId)),
    moveNode: (nodeId, position) => commitBoard((previous) => moveEvidenceBoardNode(previous, nodeId, position)),
  };

  return <EvidenceBoardContext.Provider value={value}>{children}</EvidenceBoardContext.Provider>;
}

export function useEvidenceBoard(): EvidenceBoardContextValue {
  const context = useContext(EvidenceBoardContext);
  if (context === null) throw new Error("useEvidenceBoard requires EvidenceBoardProvider");
  return context;
}
