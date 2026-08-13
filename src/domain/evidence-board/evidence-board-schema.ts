import { z } from "zod";

import { idSchema } from "@/content/schemas";
import type { EvidenceBoardSnapshotV1 } from "./types";

const boardSequenceSuffix = "(?:0|[1-9a-z][0-9a-z]*)";
const noteIdPattern = new RegExp(`^note_${boardSequenceSuffix}$`);
const edgeIdPattern = new RegExp(`^edge_${boardSequenceSuffix}$`);
const finiteNumberSchema = z.number().refine(Number.isFinite, "must be finite");
const counterSchema = z.number().int().min(0).refine(Number.isSafeInteger, "must be a safe integer");

export const evidenceBoardPositionSchema = z.object({
  x: finiteNumberSchema,
  y: finiteNumberSchema,
}).strict();

export const evidenceBoardEvidenceNodeSchema = z.object({
  evidenceId: idSchema,
  position: evidenceBoardPositionSchema,
}).strict();

export const evidenceBoardNoteNodeSchema = z.object({
  id: z.string().regex(noteIdPattern),
  text: z.string().refine(
    (value) => value.length > 0 && value === value.trim(),
    "must be nonblank trimmed text",
  ),
  position: evidenceBoardPositionSchema,
}).strict();

const boardNodeIdSchema = z.string().refine(isBoardNodeId, "must be a board node ID");

export const evidenceBoardPlayerEdgeSchema = z.object({
  id: z.string().regex(edgeIdPattern),
  sourceNodeId: boardNodeIdSchema,
  targetNodeId: boardNodeIdSchema,
}).strict();

const snapshotShapeSchema = z.object({
  version: z.literal(1),
  evidenceNodes: z.array(evidenceBoardEvidenceNodeSchema),
  noteNodes: z.array(evidenceBoardNoteNodeSchema),
  edges: z.array(evidenceBoardPlayerEdgeSchema),
  nextNoteSequence: counterSchema,
  nextEdgeSequence: counterSchema,
}).strict();

export function parseEvidenceBoardSnapshot(value: unknown): EvidenceBoardSnapshotV1 {
  const snapshot = snapshotShapeSchema.parse(value);
  validateSnapshotInvariants(snapshot);
  return snapshot;
}

export function isNoteNodeId(value: string): boolean {
  return noteIdPattern.test(value);
}

export function isEdgeId(value: string): boolean {
  return edgeIdPattern.test(value);
}

export function isEvidenceNodeId(value: string): boolean {
  if (!value.startsWith("evidence:")) return false;
  return idSchema.safeParse(value.slice("evidence:".length)).success;
}

export function isBoardNodeId(value: string): boolean {
  return isEvidenceNodeId(value) || isNoteNodeId(value);
}

export function evidenceNodeId(evidenceId: string): string {
  return `evidence:${evidenceId}`;
}

function validateSnapshotInvariants(snapshot: EvidenceBoardSnapshotV1): void {
  const evidenceIds = new Set<string>();
  for (const node of snapshot.evidenceNodes) {
    if (evidenceIds.has(node.evidenceId)) throw new Error(`duplicate evidence node '${node.evidenceId}'`);
    evidenceIds.add(node.evidenceId);
  }

  const noteIds = new Set<string>();
  for (const note of snapshot.noteNodes) {
    if (noteIds.has(note.id)) throw new Error(`duplicate note node '${note.id}'`);
    noteIds.add(note.id);
  }

  const nodeIds = new Set([...snapshot.evidenceNodes.map((node) => evidenceNodeId(node.evidenceId)), ...noteIds]);
  const edgeIds = new Set<string>();
  const endpointPairs = new Set<string>();
  for (const edge of snapshot.edges) {
    if (edgeIds.has(edge.id)) throw new Error(`duplicate edge '${edge.id}'`);
    if (!nodeIds.has(edge.sourceNodeId) || !nodeIds.has(edge.targetNodeId)) {
      throw new Error(`edge '${edge.id}' has a dangling endpoint`);
    }
    if (!(edge.sourceNodeId < edge.targetNodeId)) throw new Error(`edge '${edge.id}' is not canonical`);
    const pair = `${edge.sourceNodeId}\u0000${edge.targetNodeId}`;
    if (endpointPairs.has(pair)) throw new Error(`duplicate edge endpoints for '${edge.id}'`);
    edgeIds.add(edge.id);
    endpointPairs.add(pair);
  }

  validateCounter(snapshot.nextNoteSequence, noteIds, "note_");
  validateCounter(snapshot.nextEdgeSequence, edgeIds, "edge_");
}

function validateCounter(counter: number, ids: ReadonlySet<string>, prefix: string): void {
  for (const id of ids) {
    const suffix = id.slice(prefix.length);
    const sequence = Number.parseInt(suffix, 36);
    if (!Number.isSafeInteger(sequence) || sequence.toString(36) !== suffix || counter <= sequence) {
      throw new Error(`invalid ${prefix} counter`);
    }
  }
}
