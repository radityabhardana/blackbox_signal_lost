import { describe, expect, it } from "vitest";
import { createEvidenceBoardTestSession } from "@/test/fixtures/evidence-board-content";
import { createInitialEvidenceBoardState, createEvidenceBoardNote, createEvidenceBoardPlayerEdge, moveEvidenceBoardNode, syncDiscoveredEvidence } from "@/domain/evidence-board";
import { parseTrustedSaveGameV2 } from "@/domain/saves";
import { composeSaveGameV2 } from "./save-composer";

describe("composeSaveGameV2", () => {
  it("composes trusted V2 session data without presentation state", () => {
    const session = createEvidenceBoardTestSession();
    const initialBoard = syncDiscoveredEvidence(
      createInitialEvidenceBoardState(),
      session.content,
      session.initialState.discoveredEntityIds,
    );
    const withNote = createEvidenceBoardNote(initialBoard, "Field note", { x: 4, y: 5 });
    const withEdge = createEvidenceBoardPlayerEdge(withNote, "note_0", "evidence:evidence_test");
    const board = moveEvidenceBoardNode(withEdge, "evidence:evidence_test", { x: 99, y: 111 });
    const gameEvents = [{ type: "preserve_this_event", value: "yes" }];
    const uiSnapshot = { layout: "desktop" };
    const settings = { volume: 0.7 };

    const composed = composeSaveGameV2({
      slotId: "slot_test",
      contentVersion: session.content.case.version,
      applicationVersion: "0.1.0",
      updatedAt: "2041-11-18T22:00:00Z",
      currentCaseId: session.content.case.id,
      gameEvents,
      caseEngineState: session.initialState,
      evidenceBoard: board,
      uiSnapshot,
      settings,
    });
    const trusted = parseTrustedSaveGameV2(composed);

    expect(trusted.saveSchemaVersion).toBe(2);
    expect(trusted.sessionSnapshot.version).toBe(1);
    expect(trusted.sessionSnapshot.caseEngineState).toEqual(session.initialState);
    expect(trusted.sessionSnapshot.evidenceBoard.noteNodes).toEqual([
      { id: "note_0", text: "Field note", position: { x: 4, y: 5 } },
    ]);
    expect(trusted.sessionSnapshot.evidenceBoard.edges).toEqual([
      { id: "edge_0", sourceNodeId: "evidence:evidence_test", targetNodeId: "note_0" },
    ]);
    expect(trusted.sessionSnapshot.evidenceBoard.evidenceNodes.find((node) => node.evidenceId === "evidence_test")?.position).toEqual({ x: 99, y: 111 });
    expect(trusted.gameEvents).toEqual(gameEvents);
    expect(trusted.uiSnapshot).toEqual(uiSnapshot);
    expect(trusted.settings).toEqual(settings);
    expect(JSON.stringify(trusted)).not.toContain("ReactFlow");
    expect(JSON.stringify(trusted)).not.toContain("viewport");
    expect(JSON.stringify(trusted)).not.toContain("selection");
  });
});
