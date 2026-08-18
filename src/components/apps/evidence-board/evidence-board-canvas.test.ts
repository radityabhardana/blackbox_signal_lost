import { describe, expect, it } from "vitest";
import type { Node, NodeChange } from "@xyflow/react";
import { createEvidenceBoardNote, createInitialEvidenceBoardState, removeEvidenceBoardNote } from "@/domain/evidence-board";
import { applyTransientNodeChanges, getNextNotePosition } from "./evidence-board-canvas";
import type { EvidenceFlowNodeData } from "@/features/evidence-board/evidence-board-react-flow-adapter";

const node: Node<EvidenceFlowNodeData> = {
  id: "evidence:evidence_test",
  type: "evidence",
  position: { x: 48, y: 48 },
  data: {
    kind: "evidence",
    title: "Evidence",
    summary: "Detail",
    evidenceType: "document",
    tags: [],
    evidenceId: "evidence_test",
  },
};

describe("EvidenceBoardCanvas helpers", () => {
  it("uses the next sequence ordinal with finite visible-center and fallback positions", () => {
    const center = getNextNotePosition({ left: 20, top: 30, width: 400, height: 200 }, ({ x, y }) => ({ x: x / 2, y: y / 2 }), { x: 0, y: 0, zoom: 1 }, 5);
    const fallback = getNextNotePosition(undefined, () => ({ x: Number.NaN, y: Number.NaN }), { x: Number.NaN, y: 0, zoom: 0 }, 5);
    expect(center).toEqual({ x: 134, y: 89 });
    expect(fallback).toEqual({ x: 24, y: 24 });
    expect(Number.isFinite(center.x) && Number.isFinite(center.y)).toBe(true);
    expect(Number.isFinite(fallback.x) && Number.isFinite(fallback.y)).toBe(true);
  });

  it("keeps note placement ordinal monotonic after delete and recreate", () => {
    const firstPosition = getNextNotePosition(undefined, () => ({ x: 0, y: 0 }), { x: 0, y: 0, zoom: 1 }, 0);
    const first = createEvidenceBoardNote(createInitialEvidenceBoardState(), "First", firstPosition);
    const afterDelete = removeEvidenceBoardNote(first, "note_0");
    const secondPosition = getNextNotePosition(undefined, () => ({ x: 0, y: 0 }), { x: 0, y: 0, zoom: 1 }, afterDelete.nextNoteSequence);
    const second = createEvidenceBoardNote(afterDelete, "Second", secondPosition);
    expect(second.noteNodes).toEqual([{ id: "note_1", text: "Second", position: { x: 24, y: 0 } }]);
    expect(second.nextNoteSequence).toBe(2);
  });

  it("keeps authoritative nodes on React Flow remove changes while retaining transient drag movement", () => {
    const removed = applyTransientNodeChanges([node], [{ type: "remove", id: node.id } as NodeChange<Node<EvidenceFlowNodeData>>]);
    const moved = applyTransientNodeChanges([node], [{ type: "position", id: node.id, position: { x: 200, y: 100 }, dragging: true }]);
    expect(removed).toEqual([node]);
    expect(moved[0]?.position).toEqual({ x: 200, y: 100 });
    expect(node.position).toEqual({ x: 48, y: 48 });
  });
});
