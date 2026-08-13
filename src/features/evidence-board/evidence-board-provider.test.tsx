import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { contentBundleSchema } from "@/content/validator";
import { CaseSessionProvider } from "@/features/session/case-session";
import { createEvidenceBoardTestSession } from "@/test/fixtures/evidence-board-content";
import { EvidenceBoardProvider, useEvidenceBoard } from "./evidence-board-provider";

function Probe({ id }: { id: string }) {
  const { board, createNote, createEdge, moveNode } = useEvidenceBoard();
  const position = id === "one" ? { x: 111, y: 222 } : { x: 99, y: 88 };
  return <><button type="button" onClick={() => createNote("Note", { x: 1, y: 2 })}>Add {id}</button><button type="button" onClick={() => createEdge("evidence:evidence_test", "evidence:evidence_board_test_second")}>Edge {id}</button><button type="button" onClick={() => moveNode("evidence:evidence_test", position)}>Move {id}</button><output data-testid={`board-${id}`}>{JSON.stringify(board)}</output></>;
}

describe("EvidenceBoardProvider", () => {
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

  it("resets when content identity changes for the same case id", () => {
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
    expect(screen.getByTestId("board-one")).toHaveTextContent('"noteNodes":[]');
    expect(screen.getByTestId("board-one")).toHaveTextContent('"edges":[]');
    expect(screen.getByTestId("board-one")).toHaveTextContent('"position":{"x":48,"y":48}');
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
