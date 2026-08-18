import { act, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { contentBundleSchema } from "@/content/validator";
import {
  createEvidenceBoardNote,
  createInitialEvidenceBoardState,
  syncDiscoveredEvidence,
} from "@/domain/evidence-board";
import type { EvidenceBoardChange } from "./evidence-board-provider";
import { CaseSessionProvider } from "@/features/session/case-session";
import { createEvidenceBoardTestSession } from "@/test/fixtures/evidence-board-content";
import { EvidenceBoardProvider, useEvidenceBoard } from "./evidence-board-provider";

function Probe({ id }: { id: string }) {
  const { board, createNote, createEdge, moveNode } = useEvidenceBoard();
  const position = id === "one" ? { x: 111, y: 222 } : { x: 99, y: 88 };
  return <><button type="button" onClick={() => createNote("Note", { x: 1, y: 2 })}>Add {id}</button><button type="button" onClick={() => createEdge("evidence:evidence_test", "evidence:evidence_board_test_second")}>Edge {id}</button><button type="button" onClick={() => moveNode("evidence:evidence_test", position)}>Move {id}</button><output data-testid={`board-${id}`}>{JSON.stringify(board)}</output></>;
}

describe("EvidenceBoardProvider", () => {
  it("uses the restored board as its first reconciliation base", async () => {
    const fixture = createEvidenceBoardTestSession();
    const restored = createEvidenceBoardNote(
      syncDiscoveredEvidence(createInitialEvidenceBoardState(), fixture.content, fixture.initialState.discoveredEntityIds),
      "Restored note",
      { x: 321, y: 654 },
    );
    const changes: EvidenceBoardChange[] = [];

    render(
      <CaseSessionProvider content={fixture.content} mailChannelId="channel_test" initialState={fixture.initialState}>
        <EvidenceBoardProvider initialBoard={restored} onBoardChange={(change) => changes.push(change)}>
          <Probe id="one" />
        </EvidenceBoardProvider>
      </CaseSessionProvider>,
    );

    expect(screen.getByTestId("board-one")).toHaveTextContent("Restored note");
    await waitFor(() => expect(changes.filter((change) => change.kind === "reconciled")).toHaveLength(1));
    expect(changes.find((change) => change.kind === "reconciled")?.state.noteNodes).toContainEqual(
      expect.objectContaining({ text: "Restored note" }),
    );
    expect(changes.filter((change) => change.kind === "committed")).toEqual([]);
  });

  it("emits reconciliation without creating an effect loop", async () => {
    const fixture = createEvidenceBoardTestSession();
    const changes: EvidenceBoardChange[] = [];
    const view = render(
      <CaseSessionProvider content={fixture.content} mailChannelId="channel_test" initialState={fixture.initialState}>
        <EvidenceBoardProvider onBoardChange={(change) => changes.push(change)}>
          <Probe id="one" />
        </EvidenceBoardProvider>
      </CaseSessionProvider>,
    );

    await waitFor(() => expect(changes.filter((change) => change.kind === "reconciled")).toHaveLength(1));
    await act(async () => {
      view.rerender(
        <CaseSessionProvider content={fixture.content} mailChannelId="channel_test" initialState={fixture.initialState}>
          <EvidenceBoardProvider onBoardChange={(change) => changes.push(change)}>
            <Probe id="one" />
          </EvidenceBoardProvider>
        </CaseSessionProvider>,
      );
      await Promise.resolve();
    });
    expect(changes.filter((change) => change.kind === "reconciled")).toHaveLength(1);
  });

  it("emits committed changes only when an A1 operation returns a new state", () => {
    const fixture = createEvidenceBoardTestSession();
    const changes: EvidenceBoardChange[] = [];
    render(
      <CaseSessionProvider content={fixture.content} mailChannelId="channel_test" initialState={fixture.initialState}>
        <EvidenceBoardProvider onBoardChange={(change) => changes.push(change)}>
          <Probe id="one" />
        </EvidenceBoardProvider>
      </CaseSessionProvider>,
    );

    fireEvent.click(screen.getByRole("button", { name: "Move one" }));
    fireEvent.click(screen.getByRole("button", { name: "Move one" }));

    expect(changes.filter((change) => change.kind === "committed")).toHaveLength(1);
  });

  it("reconciles real session discovery without mutating engine state", () => {
    const fixture = createEvidenceBoardTestSession();
    render(<CaseSessionProvider content={fixture.content} mailChannelId="channel_test" initialState={fixture.initialState}><EvidenceBoardProvider><Probe id="one" /></EvidenceBoardProvider></CaseSessionProvider>);
    expect(screen.getByTestId("board-one")).toHaveTextContent("evidence_board_test_second");
    fireEvent.click(screen.getByRole("button", { name: "Add one" }));
    expect(fixture.initialState.discoveredEntityIds).toEqual(["evidence_test", "evidence_board_test_second"]);
    expect(fixture.initialState.eventHistory).toEqual([{ type: "evidence_board_test_bootstrap" }]);
  });

  it("is safe without a case session", () => {
    render(<EvidenceBoardProvider><Probe id="one" /></EvidenceBoardProvider>);
    expect(screen.getByTestId("board-one")).toHaveTextContent('"evidenceNodes":[]');
  });

  it("shares committed state across mounted board views", () => {
    const fixture = createEvidenceBoardTestSession();
    render(<CaseSessionProvider content={fixture.content} mailChannelId="channel_test" initialState={fixture.initialState}><EvidenceBoardProvider><Probe id="one" /><Probe id="two" /></EvidenceBoardProvider></CaseSessionProvider>);
    fireEvent.click(screen.getByRole("button", { name: "Add one" }));
    expect(screen.getByTestId("board-two")).toHaveTextContent('"noteNodes":[{"id":"note_0"');
    fireEvent.click(screen.getByRole("button", { name: "Edge one" }));
    expect(screen.getByTestId("board-two")).toHaveTextContent('"edges":[{"id":"edge_0"');
    fireEvent.click(screen.getByRole("button", { name: "Move one" }));
    expect(screen.getByTestId("board-two")).toHaveTextContent('"position":{"x":111,"y":222}');
  });

  it("preserves player board state when content identity changes for the same case id", () => {
    const fixture = createEvidenceBoardTestSession();
    const replacementContent = contentBundleSchema.parse({
      ...fixture.content,
      evidence: fixture.content.evidence.map((evidence) => evidence.id === "evidence_test" ? { ...evidence, title: "Replacement evidence" } : evidence),
    });
    const view = render(<CaseSessionProvider content={fixture.content} mailChannelId="channel_test" initialState={fixture.initialState}><EvidenceBoardProvider><Probe id="one" /></EvidenceBoardProvider></CaseSessionProvider>);
    fireEvent.click(screen.getByRole("button", { name: "Add one" }));
    fireEvent.click(screen.getByRole("button", { name: "Edge one" }));
    fireEvent.click(screen.getByRole("button", { name: "Move one" }));
    view.rerender(<CaseSessionProvider content={replacementContent} mailChannelId="channel_test" initialState={fixture.initialState}><EvidenceBoardProvider><Probe id="one" /></EvidenceBoardProvider></CaseSessionProvider>);
    // A same-case content-reference change (e.g. a live locale switch) carries
    // identical ids/rules, so the board reconciles and keeps player-authored
    // notes, edges, and positions instead of resetting.
    expect(screen.getByTestId("board-one")).toHaveTextContent('"noteNodes":[{"id":"note_0"');
    expect(screen.getByTestId("board-one")).toHaveTextContent('"edges":[{"id":"edge_0"');
    expect(screen.getByTestId("board-one")).toHaveTextContent('"position":{"x":111,"y":222}');
  });

  it("applies only the last explicit move to a node while preserving unrelated board state", () => {
    const fixture = createEvidenceBoardTestSession();
    render(<CaseSessionProvider content={fixture.content} mailChannelId="channel_test" initialState={fixture.initialState}><EvidenceBoardProvider><Probe id="one" /><Probe id="two" /></EvidenceBoardProvider></CaseSessionProvider>);
    fireEvent.click(screen.getByRole("button", { name: "Add two" }));
    fireEvent.click(screen.getByRole("button", { name: "Edge two" }));
    fireEvent.click(screen.getByRole("button", { name: "Move two" }));
    expect(screen.getByTestId("board-one")).toHaveTextContent('"position":{"x":99,"y":88}');
    fireEvent.click(screen.getByRole("button", { name: "Move one" }));
    expect(screen.getByTestId("board-two")).toHaveTextContent('"position":{"x":111,"y":222}');
    expect(screen.getByTestId("board-two")).toHaveTextContent('"noteNodes":[{"id":"note_0"');
    expect(screen.getByTestId("board-two")).toHaveTextContent('"edges":[{"id":"edge_0"');
  });
});
