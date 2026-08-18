import { screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import type { Node, NodeProps, Position } from "@xyflow/react";
import type { EvidenceFlowNodeData } from "@/features/evidence-board/evidence-board-react-flow-adapter";
import { renderWithProviders } from "@/test/helpers/render";
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
  summary: "A transit event.",
  evidenceType: "database_record",
  source: "ferry_archive",
  tags: ["transit"],
  evidenceId: "ev_001_ferry_departure",
};

describe("BoardNode evidence visual", () => {
  it("renders a thumbnail for an evidence node with a known evidence id", () => {
    const { container } = renderWithProviders(<BoardNode {...boardNodeProps(evidenceData)} />);
    expect(container.querySelector("svg[aria-hidden='true']")).not.toBeNull();
    expect(screen.getByText("Ferry Departure Record")).toBeInTheDocument();
  });

  it("renders no thumbnail for an evidence node with an unknown evidence id", () => {
    const { container } = renderWithProviders(
      <BoardNode
        {...boardNodeProps({ ...evidenceData, evidenceId: "ev_999_unknown" })}
      />,
    );
    expect(container.querySelector("svg")).toBeNull();
    expect(screen.getByText("Ferry Departure Record")).toBeInTheDocument();
  });

  it("renders no thumbnail for a note node", () => {
    const { container } = renderWithProviders(
      <BoardNode
        {...boardNodeProps({
          kind: "note",
          text: "A note.",
        })}
      />,
    );
    expect(container.querySelector("svg")).toBeNull();
    expect(screen.getByText("Private note")).toBeInTheDocument();
    expect(screen.getByText("A note.")).toBeInTheDocument();
  });
});

describe("BoardNode localization", () => {
  it("localizes the evidence type label and source system", () => {
    renderWithProviders(<BoardNode {...boardNodeProps(evidenceData)} />);
    expect(screen.getByText("Database record: A transit event.")).toBeInTheDocument();
    expect(screen.getByText("Ferry archive")).toBeInTheDocument();
  });

  it("shows the unknown-source label when the evidence has no source", () => {
    const withoutSource: EvidenceFlowNodeData = {
      kind: "evidence",
      title: "Ferry Departure Record",
      summary: "A transit event.",
      evidenceType: "database_record",
      tags: ["transit"],
      evidenceId: "ev_001_ferry_departure",
    };
    renderWithProviders(<BoardNode {...boardNodeProps(withoutSource)} />);
    expect(screen.getByText("Unknown source")).toBeInTheDocument();
  });
});