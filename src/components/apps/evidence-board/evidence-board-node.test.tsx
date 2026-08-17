import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import type { Node, NodeProps, Position } from "@xyflow/react";
import type { EvidenceFlowNodeData } from "@/features/evidence-board/evidence-board-react-flow-adapter";
import { BoardNode } from "./evidence-board-canvas";

vi.mock("@xyflow/react", async () => {
  return {
    Handle: () => null,
    Position: { Left: "left", Right: "right" },
  };
});

function boardNodeProps(
  data: EvidenceFlowNodeData,
): NodeProps<Node<EvidenceFlowNodeData>> {
  return {
    id: "evidence:test",
    type: "evidence",
    data,
    width: 240,
    height: 120,
    sourcePosition: "right" as Position,
    targetPosition: "left" as Position,
    dragging: false,
    zIndex: 0,
    selectable: true,
    deletable: true,
    selected: false,
    draggable: true,
    isConnectable: true,
    positionAbsoluteX: 0,
    positionAbsoluteY: 0,
  } as NodeProps<Node<EvidenceFlowNodeData>>;
}

const evidenceData: EvidenceFlowNodeData = {
  kind: "evidence",
  title: "Ferry Departure Record",
  detail: "database_record: A transit event.",
  source: "ferry_archive",
  tags: ["transit"],
  evidenceId: "ev_001_ferry_departure",
};

describe("BoardNode evidence visual", () => {
  it("renders a thumbnail for an evidence node with a known evidence id", () => {
    const { container } = render(<BoardNode {...boardNodeProps(evidenceData)} />);
    expect(container.querySelector("svg[aria-hidden='true']")).not.toBeNull();
    expect(screen.getByText("Ferry Departure Record")).toBeInTheDocument();
  });

  it("renders no thumbnail for an evidence node with an unknown evidence id", () => {
    const { container } = render(
      <BoardNode
        {...boardNodeProps({ ...evidenceData, evidenceId: "ev_999_unknown" })}
      />,
    );
    expect(container.querySelector("svg")).toBeNull();
    expect(screen.getByText("Ferry Departure Record")).toBeInTheDocument();
  });

  it("renders no thumbnail for a note node", () => {
    const { container } = render(
      <BoardNode
        {...boardNodeProps({
          kind: "note",
          title: "Private note",
          detail: "A note.",
        })}
      />,
    );
    expect(container.querySelector("svg")).toBeNull();
    expect(screen.getByText("Private note")).toBeInTheDocument();
  });
});