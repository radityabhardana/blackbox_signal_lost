import { describe, expect, it } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { CaseSessionProvider, useCaseSession } from "@/features/session/case-session";
import { createInitialEngineState } from "@/domain/engine";
import { contentBundleSchema } from "@/content/validator";
import type { ContentBundle } from "@/content/validator";
import type { SignalComparisonPuzzle } from "@/content/schemas";
import bundleJson from "@/content/fixtures/bundles/valid/bundle_basic_valid.json";
import { SignalAnalyzerApp } from "./signal-analyzer-app";

const signalPuzzle: SignalComparisonPuzzle = {
  kind: "signal_comparison",
  id: "puzzle_signal_test",
  caseId: "case_test",
  title: "Replay signature check",
  referenceLabel: "Baseline",
  disputedLabel: "Disputed",
  sourceEvidenceId: "evidence_test",
  referenceRecordId: "record_test",
  solutionEvidenceId: "evidence_test",
  properties: [
    {
      id: "property_gate",
      label: "Gate open time",
      referenceValue: "22:04:11",
      disputedValue: "22:04:09",
      decisive: true,
    },
    {
      id: "property_signature",
      label: "Signal signature",
      referenceValue: "0x3f2a",
      disputedValue: "0x9c71",
      decisive: true,
    },
    {
      id: "property_ambient",
      label: "Ambient noise",
      referenceValue: "-62 dB",
      disputedValue: "-62 dB",
      decisive: false,
    },
  ],
  conclusionText: "The disputed signal is a replay of the baseline record.",
};

function EventHistoryProbe() {
  const session = useCaseSession();
  return <div data-testid="event-history">{session.state.eventHistory.map((e) => e.type).join(",")}</div>;
}

function renderSignalAnalyzer({
  unlocked = true,
  puzzles = [signalPuzzle],
}: { unlocked?: boolean; puzzles?: readonly SignalComparisonPuzzle[] } = {}) {
  const baseContent = contentBundleSchema.parse(bundleJson);
  const content: ContentBundle = { ...baseContent, puzzles: [...puzzles] };
  const initialState = {
    ...createInitialEngineState(),
    unlockedApplications: unlocked ? ["app_signal_analyzer"] : [],
  };
  return render(
    <CaseSessionProvider content={content} mailChannelId="channel_test" initialState={initialState}>
      <EventHistoryProbe />
      <SignalAnalyzerApp />
    </CaseSessionProvider>,
  );
}

function eventHistory(): string {
  return screen.getByTestId("event-history").textContent ?? "";
}

describe("SignalAnalyzerApp", () => {
  it("renders locked state without a session", () => {
    render(<SignalAnalyzerApp />);
    expect(screen.getByRole("region", { name: "Signal Analyzer" })).toHaveTextContent(
      "Signal Analyzer unavailable",
    );
  });

  it("renders locked state when app not unlocked", () => {
    renderSignalAnalyzer({ unlocked: false });
    expect(screen.getByRole("region", { name: "Signal Analyzer" })).toHaveTextContent(
      "Signal Analyzer unavailable",
    );
  });

  it("renders the authored comparison", () => {
    renderSignalAnalyzer();
    const region = screen.getByRole("region", { name: "Signal Analyzer" });
    expect(region).toHaveTextContent("Replay signature check");
    expect(region).toHaveTextContent("Comparing Baseline vs Disputed");
    for (const property of signalPuzzle.properties) {
      expect(region).toHaveTextContent(property.label);
      expect(region).toHaveTextContent(property.referenceValue);
      expect(region).toHaveTextContent(property.disputedValue);
    }
  });

  it("marks a property with keyboard", async () => {
    const user = userEvent.setup();
    renderSignalAnalyzer();
    const markButtons = screen.getAllByRole("checkbox");
    markButtons[0]!.focus();
    await user.keyboard(" ");
    const firstButton = screen.getByRole("checkbox", {
      name: "Mark Gate open time as a discrepancy",
    });
    expect(firstButton).toHaveAttribute("aria-checked", "true");
    expect(firstButton).toHaveTextContent("Marked");
  });

  it("incorrect submission shows feedback and does not dispatch", async () => {
    const user = userEvent.setup();
    renderSignalAnalyzer();
    await user.click(screen.getByRole("checkbox", { name: "Mark Ambient noise as a discrepancy" }));
    await user.click(screen.getByRole("button", { name: "Analyze" }));
    expect(screen.getByRole("status")).toHaveTextContent(
      "The selected discrepancies do not match the event signature. Review the comparison and retry.",
    );
    expect(eventHistory()).not.toContain("puzzle_completed");
  });

  it("correct submission dispatches and shows conclusion", async () => {
    const user = userEvent.setup();
    renderSignalAnalyzer();
    await user.click(screen.getByRole("checkbox", { name: "Mark Gate open time as a discrepancy" }));
    await user.click(screen.getByRole("checkbox", { name: "Mark Signal signature as a discrepancy" }));
    await user.click(screen.getByRole("button", { name: "Analyze" }));
    expect(screen.getByRole("status")).toHaveTextContent(
      "The disputed signal is a replay of the baseline record.",
    );
    expect(screen.getByRole("status")).toHaveTextContent("Authenticity determination complete.");
    expect(eventHistory()).toContain("puzzle_completed");
    expect(screen.getByRole("button", { name: "Analyze" })).toBeDisabled();
  });

  it("retry after incorrect submission", async () => {
    const user = userEvent.setup();
    renderSignalAnalyzer();
    await user.click(screen.getByRole("checkbox", { name: "Mark Gate open time as a discrepancy" }));
    await user.click(screen.getByRole("button", { name: "Analyze" }));
    expect(screen.getByRole("status")).toHaveTextContent("do not match the event signature");
    await user.click(screen.getByRole("checkbox", { name: "Mark Signal signature as a discrepancy" }));
    await user.click(screen.getByRole("button", { name: "Analyze" }));
    expect(screen.getByRole("status")).toHaveTextContent("Authenticity determination complete.");
    expect(eventHistory().match(/puzzle_completed/g)).toHaveLength(1);
  });

  it("no puzzle renders honest empty state", () => {
    renderSignalAnalyzer({ puzzles: [] });
    expect(screen.getByRole("region", { name: "Signal Analyzer" })).toHaveTextContent(
      "No signal data available",
    );
  });
});
