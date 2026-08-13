import { describe, expect, it } from "vitest";

import { parseEvidenceBoardSnapshot } from "./evidence-board-schema";

const emptySnapshot = {
  version: 1,
  evidenceNodes: [],
  noteNodes: [],
  edges: [],
  nextNoteSequence: 0,
  nextEdgeSequence: 0,
};

describe("EvidenceBoardSnapshotV1", () => {
  it("parses an empty and a populated canonical V1 snapshot", () => {
    expect(parseEvidenceBoardSnapshot(emptySnapshot)).toEqual(emptySnapshot);
    expect(
      parseEvidenceBoardSnapshot({
        version: 1,
        evidenceNodes: [{ evidenceId: "evidence_test", position: { x: 1, y: 2 } }],
        noteNodes: [{ id: "note_0", text: "Private note", position: { x: 3, y: 4 } }],
        edges: [{ id: "edge_0", sourceNodeId: "evidence:evidence_test", targetNodeId: "note_0" }],
        nextNoteSequence: 1,
        nextEdgeSequence: 1,
      }),
    ).toMatchObject({ version: 1, nextNoteSequence: 1, nextEdgeSequence: 1 });
  });

  it("rejects unsupported versions, unknown fields, and non-finite positions", () => {
    expect(() => parseEvidenceBoardSnapshot({ ...emptySnapshot, version: 2 })).toThrow();
    expect(() => parseEvidenceBoardSnapshot({ ...emptySnapshot, extra: true })).toThrow();
    expect(() => parseEvidenceBoardSnapshot({
      ...emptySnapshot,
      evidenceNodes: [{ evidenceId: "evidence_test", position: { x: Number.NaN, y: 0 } }],
    })).toThrow();
  });

  it("rejects invalid board IDs, counters, notes, and edges", () => {
    const populated = {
      version: 1,
      evidenceNodes: [{ evidenceId: "evidence_test", position: { x: 0, y: 0 } }],
      noteNodes: [{ id: "note_0", text: "Note", position: { x: 1, y: 1 } }],
      edges: [{ id: "edge_0", sourceNodeId: "evidence:evidence_test", targetNodeId: "note_0" }],
      nextNoteSequence: 1,
      nextEdgeSequence: 1,
    };

    for (const invalid of [
      { ...populated, nextNoteSequence: 0 },
      { ...populated, nextEdgeSequence: -1 },
      { ...populated, nextEdgeSequence: 1.5 },
      { ...populated, nextEdgeSequence: Number.MAX_SAFE_INTEGER + 1 },
      { ...populated, noteNodes: [{ ...populated.noteNodes[0], id: "note_00" }] },
      { ...populated, noteNodes: [{ ...populated.noteNodes[0], text: "  " }] },
      { ...populated, noteNodes: [{ ...populated.noteNodes[0], text: " Note" }] },
      { ...populated, noteNodes: [{ ...populated.noteNodes[0], text: "Note " }] },
      { ...populated, edges: [{ ...populated.edges[0], sourceNodeId: "note_0", targetNodeId: "evidence:evidence_test" }] },
      { ...populated, edges: [{ ...populated.edges[0], targetNodeId: "note_missing" }] },
    ]) {
      expect(() => parseEvidenceBoardSnapshot(invalid)).toThrow();
    }
  });

  it("rejects duplicate node IDs, edge IDs, and endpoint pairs", () => {
    const nodes = {
      evidenceNodes: [
        { evidenceId: "evidence_test", position: { x: 0, y: 0 } },
        { evidenceId: "evidence_second", position: { x: 1, y: 1 } },
      ],
      noteNodes: [{ id: "note_0", text: "Note", position: { x: 2, y: 2 } }],
      nextNoteSequence: 1,
    };

    expect(() => parseEvidenceBoardSnapshot({
      ...emptySnapshot,
      ...nodes,
      evidenceNodes: [...nodes.evidenceNodes, { evidenceId: "evidence_test", position: { x: 3, y: 3 } }],
    })).toThrow();
    expect(() => parseEvidenceBoardSnapshot({
      ...emptySnapshot,
      ...nodes,
      noteNodes: [...nodes.noteNodes, { id: "note_0", text: "Other", position: { x: 3, y: 3 } }],
    })).toThrow();
    expect(() => parseEvidenceBoardSnapshot({
      ...emptySnapshot,
      ...nodes,
      edges: [
        { id: "edge_0", sourceNodeId: "evidence:evidence_second", targetNodeId: "note_0" },
        { id: "edge_0", sourceNodeId: "evidence:evidence_test", targetNodeId: "note_0" },
      ],
      nextEdgeSequence: 1,
    })).toThrow();
    expect(() => parseEvidenceBoardSnapshot({
      ...emptySnapshot,
      ...nodes,
      edges: [
        { id: "edge_0", sourceNodeId: "evidence:evidence_test", targetNodeId: "note_0" },
        { id: "edge_1", sourceNodeId: "evidence:evidence_test", targetNodeId: "note_0" },
      ],
      nextEdgeSequence: 2,
    })).toThrow();
  });
});
