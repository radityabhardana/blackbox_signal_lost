import { act, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import type { Node, NodeChange, OnNodeDrag } from "@xyflow/react";
import type { ReactNode } from "react";
import { CaseSessionProvider } from "@/features/session/case-session";
import { EvidenceBoardProvider, useEvidenceBoard } from "@/features/evidence-board/evidence-board-provider";
import type { EvidenceFlowNodeData } from "@/features/evidence-board/evidence-board-react-flow-adapter";
import { createEvidenceBoardTestSession } from "@/test/fixtures/evidence-board-content";
import { EvidenceBoardCanvas } from "./evidence-board-canvas";

interface CapturedFlowProps {
  readonly children?: ReactNode;
  readonly nodes: readonly Node<EvidenceFlowNodeData>[];
  readonly onNodesChange: (changes: NodeChange<Node<EvidenceFlowNodeData>>[]) => void;
  readonly onNodeDragStop: OnNodeDrag<Node<EvidenceFlowNodeData>>;
}

let captured: CapturedFlowProps | null = null;

vi.mock("@xyflow/react", async () => {
  return {
    Background: () => null,
    Controls: () => null,
    Handle: () => null,
    Position: { Left: "left", Right: "right" },
    ReactFlow: (props: CapturedFlowProps) => {
      captured = props;
      return <div>{props.children}</div>;
    },
    useReactFlow: () => ({ screenToFlowPosition: (position: { x: number; y: number }) => position, getViewport: () => ({ x: 0, y: 0, zoom: 1 }) }),
  };
});

function BoardState() {
  const { board } = useEvidenceBoard();
  return <output data-testid="board-state">{JSON.stringify(board)}</output>;
}

describe("EvidenceBoardCanvas provider integration", () => {
  it("keeps movement transient until one drag-stop commit and reprojects the committed position", () => {
    const fixture = createEvidenceBoardTestSession();
    render(<CaseSessionProvider content={fixture.content} mailChannelId="channel_test" initialState={fixture.initialState}><EvidenceBoardProvider><EvidenceBoardCanvas onSelectNode={() => {}} onSelectEdge={() => {}} onReady={() => {}} /><BoardState /></EvidenceBoardProvider></CaseSessionProvider>);
    const before = screen.getByTestId("board-state");
    expect(before).toHaveTextContent('"position":{"x":48,"y":48}');
    const initialFlow = captured!;
    act(() => initialFlow.onNodesChange([{ type: "position", id: "evidence:evidence_test", position: { x: 200, y: 100 }, dragging: true }]));
    expect(captured!.nodes.find((node) => node.id === "evidence:evidence_test")?.position).toEqual({ x: 200, y: 100 });
    expect(before).toHaveTextContent('"position":{"x":48,"y":48}');
    const movedNode = { ...captured!.nodes.find((node) => node.id === "evidence:evidence_test")!, position: { x: 200, y: 100 } };
    act(() => initialFlow.onNodeDragStop(new MouseEvent("mouseup"), movedNode, [...captured!.nodes]));
    expect(screen.getByTestId("board-state")).toHaveTextContent('"position":{"x":200,"y":100}');
    expect(captured!.nodes.find((node) => node.id === "evidence:evidence_test")?.position).toEqual({ x: 200, y: 100 });
  });
});
