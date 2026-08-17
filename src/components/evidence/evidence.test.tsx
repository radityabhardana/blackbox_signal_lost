import { render } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import {
  ChecksumRecordVisual,
  CorridorAccessVisual,
  EmergencyCallVisual,
  EvidenceVisual,
  EVIDENCE_VISUAL_IDS,
  FerryDepartureVisual,
  IsolationEventVisual,
  ManualEscalationVisual,
  Node7SummaryVisual,
  ReplaySignatureVisual,
} from "./index";

const EXPECTED_IDS = [
  "ev_001_ferry_departure",
  "ev_001_emergency_call",
  "ev_001_replay_signature",
  "ev_001_node7_summary",
  "ev_001_manual_escalation",
  "ev_001_corridor_access",
  "ev_001_checksum_record",
  "ev_001_isolation_event",
] as const;

const NAMED_COMPONENTS = [
  ["FerryDepartureVisual", FerryDepartureVisual],
  ["EmergencyCallVisual", EmergencyCallVisual],
  ["ReplaySignatureVisual", ReplaySignatureVisual],
  ["Node7SummaryVisual", Node7SummaryVisual],
  ["ManualEscalationVisual", ManualEscalationVisual],
  ["CorridorAccessVisual", CorridorAccessVisual],
  ["ChecksumRecordVisual", ChecksumRecordVisual],
  ["IsolationEventVisual", IsolationEventVisual],
] as const;

describe("EVIDENCE_VISUAL_IDS", () => {
  it("contains exactly the 8 expected Case 001 visual identifiers", () => {
    expect(EVIDENCE_VISUAL_IDS).toEqual(EXPECTED_IDS);
    expect(EVIDENCE_VISUAL_IDS).toHaveLength(8);
  });
});

describe("Named visual components", () => {
  it.each(NAMED_COMPONENTS)("%s renders an svg with aria-hidden='true' and does not throw", (_, Component) => {
    const { container } = render(<Component className="test-custom-class" />);
    const svg = container.querySelector("svg");
    expect(svg).toBeInTheDocument();
    expect(svg).toHaveAttribute("aria-hidden", "true");
    expect(svg).toHaveClass("test-custom-class");
  });
});

describe("EvidenceVisual dispatcher", () => {
  it.each(EVIDENCE_VISUAL_IDS)("dispatches '%s' to an aria-hidden svg without throwing", (evidenceId) => {
    const { container } = render(<EvidenceVisual evidenceId={evidenceId} className="w-6 h-6" />);
    const svg = container.querySelector("svg");
    expect(svg).toBeInTheDocument();
    expect(svg).toHaveAttribute("aria-hidden", "true");
    expect(svg).toHaveClass("w-6", "h-6");
  });
});

describe("Visual content contract guards", () => {
  it.each(EVIDENCE_VISUAL_IDS)(
    "ensures '%s' contains no <text> or <image> elements (pure geometric graphics)",
    (evidenceId) => {
      const { container } = render(<EvidenceVisual evidenceId={evidenceId} />);
      const textElements = container.querySelectorAll("text");
      const imageElements = container.querySelectorAll("image");
      expect(textElements).toHaveLength(0);
      expect(imageElements).toHaveLength(0);
    },
  );

  it("ensures no hardcoded hex literals exist in rendered SVG element styles/attributes", () => {
    for (const evidenceId of EVIDENCE_VISUAL_IDS) {
      const { container } = render(<EvidenceVisual evidenceId={evidenceId} />);
      const html = container.innerHTML;
      expect(html).not.toMatch(/#[0-9a-fA-F]{3,8}/);
    }
  });
});
