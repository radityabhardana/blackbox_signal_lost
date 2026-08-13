import type { ContentBundle } from "@/content/validator";
import {
  evidenceNodeId,
  isBoardNodeId,
  isEdgeId,
  isEvidenceNodeId,
  isNoteNodeId,
  parseEvidenceBoardSnapshot,
} from "./evidence-board-schema";
import type {
  EvidenceBoardPosition,
  EvidenceBoardSnapshotV1,
  EvidenceBoardState,
} from "./types";

const GRID_COLUMNS = 3;
const GRID_ORIGIN_X = 48;
const GRID_ORIGIN_Y = 48;
const GRID_STEP_X = 260;
const GRID_STEP_Y = 180;

export function createInitialEvidenceBoardState(): EvidenceBoardState {
  return {
    evidenceNodes: [],
    noteNodes: [],
    edges: [],
    nextNoteSequence: 0,
    nextEdgeSequence: 0,
  };
}

export function serializeEvidenceBoardSnapshot(state: EvidenceBoardState): EvidenceBoardSnapshotV1 {
  return parseEvidenceBoardSnapshot({
    version: 1,
    evidenceNodes: state.evidenceNodes.map(copyEvidenceNode),
    noteNodes: state.noteNodes.map(copyNoteNode),
    edges: state.edges.map(copyEdge),
    nextNoteSequence: state.nextNoteSequence,
    nextEdgeSequence: state.nextEdgeSequence,
  });
}

export function hydrateEvidenceBoardSnapshot(snapshot: EvidenceBoardSnapshotV1): EvidenceBoardState {
  return {
    evidenceNodes: snapshot.evidenceNodes.map(copyEvidenceNode),
    noteNodes: snapshot.noteNodes.map(copyNoteNode),
    edges: snapshot.edges.map(copyEdge),
    nextNoteSequence: snapshot.nextNoteSequence,
    nextEdgeSequence: snapshot.nextEdgeSequence,
  };
}

export function createEvidenceBoardNote(
  state: EvidenceBoardState,
  text: string,
  position: EvidenceBoardPosition,
): EvidenceBoardState {
  const normalized = text.trim();
  if (normalized.length === 0 || !isFinitePosition(position) || state.nextNoteSequence === Number.MAX_SAFE_INTEGER) return state;
  const id = `note_${state.nextNoteSequence.toString(36)}`;
  return {
    ...state,
    noteNodes: [...state.noteNodes, { id, text: normalized, position: copyPosition(position) }],
    nextNoteSequence: state.nextNoteSequence + 1,
  };
}

export function updateEvidenceBoardNote(state: EvidenceBoardState, noteId: string, text: string): EvidenceBoardState {
  if (!isNoteNodeId(noteId)) return state;
  const index = state.noteNodes.findIndex((note) => note.id === noteId);
  if (index < 0) return state;
  const normalized = text.trim();
  const current = state.noteNodes[index]!;
  if (normalized.length === 0 || normalized === current.text) return state;
  const noteNodes = [...state.noteNodes];
  noteNodes[index] = { ...current, text: normalized };
  return { ...state, noteNodes };
}

export function removeEvidenceBoardNote(state: EvidenceBoardState, noteId: string): EvidenceBoardState {
  if (!isNoteNodeId(noteId) || !state.noteNodes.some((note) => note.id === noteId)) return state;
  return {
    ...state,
    noteNodes: state.noteNodes.filter((note) => note.id !== noteId),
    edges: state.edges.filter((edge) => edge.sourceNodeId !== noteId && edge.targetNodeId !== noteId),
  };
}

export function createEvidenceBoardPlayerEdge(
  state: EvidenceBoardState,
  sourceNodeId: string,
  targetNodeId: string,
): EvidenceBoardState {
  if (
    !isBoardNodeId(sourceNodeId)
    || !isBoardNodeId(targetNodeId)
    || sourceNodeId === targetNodeId
    || state.nextEdgeSequence === Number.MAX_SAFE_INTEGER
  ) return state;
  const existing = boardNodeIds(state);
  if (!existing.has(sourceNodeId) || !existing.has(targetNodeId)) return state;
  const [source, target] = sourceNodeId < targetNodeId ? [sourceNodeId, targetNodeId] : [targetNodeId, sourceNodeId];
  if (state.edges.some((edge) => edge.sourceNodeId === source && edge.targetNodeId === target)) return state;
  return {
    ...state,
    edges: [...state.edges, { id: `edge_${state.nextEdgeSequence.toString(36)}`, sourceNodeId: source, targetNodeId: target }],
    nextEdgeSequence: state.nextEdgeSequence + 1,
  };
}

export function removeEvidenceBoardPlayerEdge(state: EvidenceBoardState, edgeId: string): EvidenceBoardState {
  if (!isEdgeId(edgeId) || !state.edges.some((edge) => edge.id === edgeId)) return state;
  return { ...state, edges: state.edges.filter((edge) => edge.id !== edgeId) };
}

export function moveEvidenceBoardNode(
  state: EvidenceBoardState,
  nodeId: string,
  position: EvidenceBoardPosition,
): EvidenceBoardState {
  if (!isBoardNodeId(nodeId) || !isFinitePosition(position)) return state;
  if (isEvidenceNodeId(nodeId)) {
    const evidenceId = nodeId.slice("evidence:".length);
    const index = state.evidenceNodes.findIndex((node) => node.evidenceId === evidenceId);
    if (index < 0 || positionsEqual(state.evidenceNodes[index]!.position, position)) return state;
    const evidenceNodes = [...state.evidenceNodes];
    evidenceNodes[index] = { ...evidenceNodes[index]!, position: copyPosition(position) };
    return { ...state, evidenceNodes };
  }
  const index = state.noteNodes.findIndex((node) => node.id === nodeId);
  if (index < 0 || positionsEqual(state.noteNodes[index]!.position, position)) return state;
  const noteNodes = [...state.noteNodes];
  noteNodes[index] = { ...noteNodes[index]!, position: copyPosition(position) };
  return { ...state, noteNodes };
}

export function syncDiscoveredEvidence(
  state: EvidenceBoardState,
  content: ContentBundle,
  discoveredEntityIds: readonly string[],
): EvidenceBoardState {
  const evidenceById = new Map(content.evidence.map((evidence) => [evidence.id, evidence]));
  const discovered: string[] = [];
  const seen = new Set<string>();
  for (const id of discoveredEntityIds) {
    if (!seen.has(id) && evidenceById.has(id)) {
      seen.add(id);
      discovered.push(id);
    }
  }

  const existingById = new Map(state.evidenceNodes.map((node) => [node.evidenceId, node]));
  const evidenceNodes = discovered.map((evidenceId, index) => existingById.get(evidenceId) ?? {
    evidenceId,
    position: fallbackPosition(index),
  });
  const activeNodeIds = new Set([...evidenceNodes.map((node) => evidenceNodeId(node.evidenceId)), ...state.noteNodes.map((node) => node.id)]);
  const edges = state.edges.filter((edge) => activeNodeIds.has(edge.sourceNodeId) && activeNodeIds.has(edge.targetNodeId));

  if (sameEvidenceNodes(state.evidenceNodes, evidenceNodes) && sameEdges(state.edges, edges)) return state;
  return { ...state, evidenceNodes, edges };
}

function fallbackPosition(index: number): EvidenceBoardPosition {
  return {
    x: GRID_ORIGIN_X + (index % GRID_COLUMNS) * GRID_STEP_X,
    y: GRID_ORIGIN_Y + Math.floor(index / GRID_COLUMNS) * GRID_STEP_Y,
  };
}

function boardNodeIds(state: EvidenceBoardState): ReadonlySet<string> {
  return new Set([
    ...state.evidenceNodes.map((node) => evidenceNodeId(node.evidenceId)),
    ...state.noteNodes.map((node) => node.id),
  ]);
}

function isFinitePosition(position: EvidenceBoardPosition): boolean {
  return Number.isFinite(position.x) && Number.isFinite(position.y);
}

function positionsEqual(a: EvidenceBoardPosition, b: EvidenceBoardPosition): boolean {
  return a.x === b.x && a.y === b.y;
}

function sameEvidenceNodes(a: readonly { evidenceId: string; position: EvidenceBoardPosition }[], b: readonly { evidenceId: string; position: EvidenceBoardPosition }[]): boolean {
  return a.length === b.length && a.every((node, index) => {
    const other = b[index];
    return other !== undefined && node.evidenceId === other.evidenceId && positionsEqual(node.position, other.position);
  });
}

function sameEdges(a: readonly { id: string; sourceNodeId: string; targetNodeId: string }[], b: readonly { id: string; sourceNodeId: string; targetNodeId: string }[]): boolean {
  return a.length === b.length && a.every((edge, index) => {
    const other = b[index];
    return other !== undefined && edge.id === other.id && edge.sourceNodeId === other.sourceNodeId && edge.targetNodeId === other.targetNodeId;
  });
}

function copyPosition(position: EvidenceBoardPosition): EvidenceBoardPosition {
  return { x: position.x, y: position.y };
}

function copyEvidenceNode(node: EvidenceBoardState["evidenceNodes"][number]) {
  return { evidenceId: node.evidenceId, position: copyPosition(node.position) };
}

function copyNoteNode(node: EvidenceBoardState["noteNodes"][number]) {
  return { id: node.id, text: node.text, position: copyPosition(node.position) };
}

function copyEdge(edge: EvidenceBoardState["edges"][number]) {
  return { id: edge.id, sourceNodeId: edge.sourceNodeId, targetNodeId: edge.targetNodeId };
}
