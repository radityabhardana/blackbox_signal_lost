import { describe, expect, it } from "vitest";
import { createEvidenceBoardNote, createInitialEvidenceBoardState, syncDiscoveredEvidence } from "@/domain/evidence-board";
import { contentBundleSchema } from "@/content/validator";
import bundleJson from "@/content/fixtures/bundles/valid/bundle_basic_valid.json";
import { projectEvidenceBoardNodes } from "./evidence-board-react-flow-adapter";

describe("evidence board React Flow adapter", () => {
  it("projects authored evidence and private notes without mutating board state", () => {
    const content = contentBundleSchema.parse(bundleJson);
    const board = createEvidenceBoardNote(syncDiscoveredEvidence(createInitialEvidenceBoardState(), content, ["evidence_test"]), "Note", { x: 1, y: 2 });
    expect(projectEvidenceBoardNodes(board, content)).toMatchObject([{ id: "evidence:evidence_test" }, { id: "note_0" }]);
    expect(board.noteNodes).toHaveLength(1);
  });

  it("emits raw ids and authored prose only, never display strings", () => {
    const content = contentBundleSchema.parse(bundleJson);
    const board = syncDiscoveredEvidence(createInitialEvidenceBoardState(), content, ["evidence_test"]);
    const [evidenceNode, noteNode] = projectEvidenceBoardNodes(
      createEvidenceBoardNote(board, "Note", { x: 1, y: 2 }),
      content,
    );
    expect(evidenceNode?.data).toEqual({
      kind: "evidence",
      title: "Test evidence",
      summary: "Test evidence summary.",
      evidenceType: "document",
      source: "test",
      tags: ["test"],
      evidenceId: "evidence_test",
    });
    expect(noteNode?.data).toEqual({ kind: "note", text: "Note" });
  });
});