import { describe, expect, it } from "vitest";

import { contentBundleSchema } from "@/content/validator";
import bundleJson from "@/content/fixtures/bundles/valid/bundle_basic_valid.json";
import {
  createEvidenceBoardNote,
  createEvidenceBoardPlayerEdge,
  createInitialEvidenceBoardState,
  hydrateEvidenceBoardSnapshot,
  moveEvidenceBoardNode,
  parseEvidenceBoardSnapshot,
  removeEvidenceBoardNote,
  removeEvidenceBoardPlayerEdge,
  serializeEvidenceBoardSnapshot,
  syncDiscoveredEvidence,
  updateEvidenceBoardNote,
} from "./index";

const content = contentBundleSchema.parse({
  ...bundleJson,
  evidence: [
    ...bundleJson.evidence,
    { ...bundleJson.evidence[0], id: "evidence_second", title: "Second evidence" },
  ],
});

describe("EvidenceBoardState", () => {
  it("creates deterministic note and edge IDs with non-destructive no-ops", () => {
    const initial = createInitialEvidenceBoardState();
    expect(createEvidenceBoardNote(initial, " ", { x: 0, y: 0 })).toBe(initial);

    const withNote = createEvidenceBoardNote(initial, "  Keep  this  ", { x: 1, y: 2 });
    expect(withNote.noteNodes).toEqual([{ id: "note_0", text: "Keep  this", position: { x: 1, y: 2 } }]);
    expect(withNote.nextNoteSequence).toBe(1);
    expect(updateEvidenceBoardNote(withNote, "note_0", " ")).toBe(withNote);
    expect(updateEvidenceBoardNote(withNote, "note_0", "Keep  this")).toBe(withNote);

    const withEvidence = syncDiscoveredEvidence(withNote, content, ["evidence_test"]);
    const withEdge = createEvidenceBoardPlayerEdge(withEvidence, "note_0", "evidence:evidence_test");
    expect(withEdge.edges).toEqual([{ id: "edge_0", sourceNodeId: "evidence:evidence_test", targetNodeId: "note_0" }]);
    expect(createEvidenceBoardPlayerEdge(withEdge, "evidence:evidence_test", "note_0")).toBe(withEdge);
    expect(createEvidenceBoardPlayerEdge(withEdge, "note_0", "note_0")).toBe(withEdge);
    expect(removeEvidenceBoardNote(withEdge, "note_0").edges).toEqual([]);
  });

  it("does not create an ID beyond the safe-integer counter boundary", () => {
    const noteBoundary = {
      ...createInitialEvidenceBoardState(),
      nextNoteSequence: Number.MAX_SAFE_INTEGER,
    };
    expect(createEvidenceBoardNote(noteBoundary, "Note", { x: 0, y: 0 })).toBe(noteBoundary);

    const edgeBoundary = {
      ...syncDiscoveredEvidence(createInitialEvidenceBoardState(), content, ["evidence_test", "evidence_second"]),
      nextEdgeSequence: Number.MAX_SAFE_INTEGER,
    };
    expect(
      createEvidenceBoardPlayerEdge(edgeBoundary, "evidence:evidence_test", "evidence:evidence_second"),
    ).toBe(edgeBoundary);
  });

  it("moves both node kinds immutably and preserves same-reference no-ops", () => {
    const initial = syncDiscoveredEvidence(createInitialEvidenceBoardState(), content, ["evidence_test"]);
    const withNote = createEvidenceBoardNote(initial, "Note", { x: 1, y: 2 });
    expect(moveEvidenceBoardNode(withNote, "bad", { x: 1, y: 2 })).toBe(withNote);
    expect(moveEvidenceBoardNode(withNote, "note_0", { x: 1, y: 2 })).toBe(withNote);

    const moved = moveEvidenceBoardNode(withNote, "evidence:evidence_test", { x: 100, y: 200 });
    expect(moved).not.toBe(withNote);
    expect(moved.evidenceNodes[0]?.position).toEqual({ x: 100, y: 200 });
    expect(withNote.evidenceNodes[0]?.position).not.toEqual({ x: 100, y: 200 });

    const movedNote = moveEvidenceBoardNode(withNote, "note_0", { x: 300, y: 400 });
    expect(movedNote).not.toBe(withNote);
    expect(movedNote.noteNodes[0]).toEqual({ id: "note_0", text: "Note", position: { x: 300, y: 400 } });
    expect(movedNote.evidenceNodes).toBe(withNote.evidenceNodes);
    expect(movedNote.edges).toBe(withNote.edges);
    expect(movedNote.nextNoteSequence).toBe(withNote.nextNoteSequence);
    expect(withNote.noteNodes[0]?.position).toEqual({ x: 1, y: 2 });
  });

  it("updates notes and removes only the requested edge immutably", () => {
    const initial = syncDiscoveredEvidence(createInitialEvidenceBoardState(), content, ["evidence_test", "evidence_second"]);
    const withNote = createEvidenceBoardNote(initial, "old text", { x: 1, y: 2 });
    const updated = updateEvidenceBoardNote(withNote, "note_0", "  new   text  ");
    expect(updated).not.toBe(withNote);
    expect(updated.noteNodes[0]).toEqual({ id: "note_0", text: "new   text", position: { x: 1, y: 2 } });
    expect(updated.nextNoteSequence).toBe(withNote.nextNoteSequence);
    expect(withNote.noteNodes[0]?.text).toBe("old text");

    const firstEdge = createEvidenceBoardPlayerEdge(updated, "note_0", "evidence:evidence_test");
    const twoEdges = createEvidenceBoardPlayerEdge(firstEdge, "note_0", "evidence:evidence_second");
    const removed = removeEvidenceBoardPlayerEdge(twoEdges, "edge_0");
    expect(removed).not.toBe(twoEdges);
    expect(removed.edges).toEqual([{ id: "edge_1", sourceNodeId: "evidence:evidence_second", targetNodeId: "note_0" }]);
    expect(removed.evidenceNodes).toBe(twoEdges.evidenceNodes);
    expect(removed.noteNodes).toBe(twoEdges.noteNodes);
    expect(removed.nextEdgeSequence).toBe(twoEdges.nextEdgeSequence);
    expect(twoEdges.edges).toHaveLength(2);
  });

  it("reconciles discovery in authoritative order without mutating inputs", () => {
    const initial = createInitialEvidenceBoardState();
    const discovered = ["evidence_second", "evidence_test", "evidence_second", "missing"];
    const beforeContent = JSON.stringify(content);
    const beforeDiscovered = [...discovered];
    const synced = syncDiscoveredEvidence(initial, content, discovered);

    expect(synced.evidenceNodes.map((node) => node.evidenceId)).toEqual(["evidence_second", "evidence_test"]);
    expect(discovered).toEqual(beforeDiscovered);
    expect(JSON.stringify(content)).toBe(beforeContent);
    expect(syncDiscoveredEvidence(synced, content, discovered)).toBe(synced);
  });

  it("removes stale evidence and edges while preserving notes", () => {
    const initial = syncDiscoveredEvidence(createInitialEvidenceBoardState(), content, ["evidence_test", "evidence_second"]);
    const withNote = createEvidenceBoardNote(initial, "Note", { x: 0, y: 0 });
    const withEvidenceEdge = createEvidenceBoardPlayerEdge(withNote, "evidence:evidence_test", "evidence:evidence_second");
    const withNoteEdge = createEvidenceBoardPlayerEdge(withEvidenceEdge, "note_0", "evidence:evidence_second");
    const reconciled = syncDiscoveredEvidence(withNoteEdge, content, ["evidence_second"]);

    expect(reconciled.evidenceNodes.map((node) => node.evidenceId)).toEqual(["evidence_second"]);
    expect(reconciled.noteNodes).toEqual(withNote.noteNodes);
    expect(reconciled.edges).toEqual([{ id: "edge_1", sourceNodeId: "evidence:evidence_second", targetNodeId: "note_0" }]);
  });

  it("preserves moved evidence positions while placing new discoveries deterministically", () => {
    const initial = syncDiscoveredEvidence(createInitialEvidenceBoardState(), content, ["evidence_test"]);
    const moved = moveEvidenceBoardNode(initial, "evidence:evidence_test", { x: 999, y: 888 });
    const synced = syncDiscoveredEvidence(moved, content, ["evidence_second", "evidence_test"]);

    expect(synced.evidenceNodes).toEqual([
      { evidenceId: "evidence_second", position: { x: 48, y: 48 } },
      { evidenceId: "evidence_test", position: { x: 999, y: 888 } },
    ]);
  });

  it("round trips independently through the strict snapshot boundary", () => {
    const state = createEvidenceBoardNote(createInitialEvidenceBoardState(), "Note", { x: 4, y: 5 });
    const snapshot = serializeEvidenceBoardSnapshot(state);
    const hydrated = hydrateEvidenceBoardSnapshot(parseEvidenceBoardSnapshot(snapshot));

    expect(hydrated).toEqual(state);
    expect(hydrated).not.toBe(state);
    expect(hydrated.noteNodes).not.toBe(state.noteNodes);
  });
});
