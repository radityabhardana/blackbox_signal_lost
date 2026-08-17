import { describe, expect, it } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { CaseSessionProvider, useCaseSession } from "@/features/session/case-session";
import { createInitialEngineState } from "@/domain/engine";
import type { CaseEngineState } from "@/domain/engine";
import { contentBundleSchema } from "@/content/validator";
import type { ContentBundle } from "@/content/validator";
import bundleJson from "@/content/fixtures/bundles/valid/bundle_basic_valid.json";
import { ConclusionReportApp } from "./conclusion-report-app";

const conclusion = {
  id: "conclusion_test",
  caseId: "case_test",
  claimSlots: [
    {
      id: "claim_loc",
      prompt: "Where did the breach occur?",
      answerOptions: [
        { id: "opt_gate", label: "Main gate", correct: true },
        { id: "opt_dock", label: "Loading dock" },
      ],
    },
    {
      id: "claim_cause",
      prompt: "What caused the signal loss?",
      answerOptions: [
        { id: "opt_failure", label: "Component failure" },
        { id: "opt_intrusion", label: "Intrusion", correct: true },
      ],
    },
  ],
  evidenceSlotCount: 1,
  disclosureChoices: [
    { id: "disc_mio", label: "Share with MIO", recipient: "mio" },
    { id: "disc_pelaga", label: "Share with Pelaga", recipient: "pelaga", redactsLocation: true },
  ],
} as const;

const endings = [
  {
    id: "ending_protected",
    caseId: "case_test",
    title: "Protected outcome ending",
    body: { sections: ["Protected outcome section."] },
  },
  {
    id: "ending_wrong",
    caseId: "case_test",
    title: "Wrong outcome ending",
    body: {},
  },
];

const outcomes = [
  {
    id: "outcome_protected",
    title: "Protected outcome",
    evaluationRule: { flagEquals: { key: "claim_claim_loc_correct", value: true } },
    priority: 2,
    endingContentId: "ending_protected",
    effects: [],
  },
  {
    id: "outcome_wrong",
    title: "Wrong outcome",
    evaluationRule: { flagEquals: { key: "claim_claim_loc_correct", value: false } },
    priority: 1,
    endingContentId: "ending_wrong",
    effects: [],
  },
];

function buildContent(): ContentBundle {
  const baseContent = contentBundleSchema.parse(bundleJson);
  return contentBundleSchema.parse({
    ...baseContent,
    case: { ...baseContent.case, outcomes },
    conclusions: [conclusion],
    endings,
  });
}

/** Test-only probe: exposes event history and the selected outcome for assertions. */
function EngineProbe() {
  const session = useCaseSession();
  return (
    <>
      <div data-testid="event-history">{session.state.eventHistory.map((event) => event.type).join(",")}</div>
      <div data-testid="selected-outcome">{session.state.selectedOutcomeId ?? ""}</div>
    </>
  );
}

function renderConclusion(options: { unlocked?: boolean; initialState?: Partial<CaseEngineState> } = {}) {
  const { unlocked = true, initialState = {} } = options;
  return render(
    <CaseSessionProvider
      content={buildContent()}
      mailChannelId="channel_test"
      initialState={{
        ...createInitialEngineState(),
        unlockedApplications: unlocked ? ["app_conclusion"] : [],
        discoveredEntityIds: ["evidence_test"],
        ...initialState,
      }}
    >
      <EngineProbe />
      <ConclusionReportApp />
    </CaseSessionProvider>,
  );
}

/** Completes the whole form; claimLoc selects the location answer by label. */
async function completeForm(user: ReturnType<typeof userEvent.setup>, claimLoc = "Main gate"): Promise<void> {
  await user.click(screen.getByRole("radio", { name: claimLoc }));
  await user.click(screen.getByRole("radio", { name: "Intrusion" }));
  await user.selectOptions(screen.getByLabelText("Evidence slot 1"), "evidence_test");
  await user.click(screen.getByRole("radio", { name: "Share with MIO" }));
}

async function submitReport(user: ReturnType<typeof userEvent.setup>): Promise<void> {
  await user.click(screen.getByRole("button", { name: "Review Report" }));
  await user.click(screen.getByRole("button", { name: "Submit Report" }));
}

function eventHistory(): string {
  return screen.getByTestId("event-history").textContent ?? "";
}

describe("ConclusionReportApp", () => {
  it("renders locked state without unlock", () => {
    renderConclusion({ unlocked: false });
    expect(screen.getByRole("region", { name: "Conclusion Report" })).toHaveTextContent(
      "Conclusion Report unavailable",
    );
  });

  it("renders the authored claims, evidence, and disclosure controls", () => {
    renderConclusion();
    const region = screen.getByRole("region", { name: "Conclusion Report" });
    expect(region).toHaveTextContent("Where did the breach occur?");
    expect(region).toHaveTextContent("What caused the signal loss?");
    expect(region).toHaveTextContent("Main gate");
    expect(region).toHaveTextContent("Loading dock");
    expect(region).toHaveTextContent("Component failure");
    expect(region).toHaveTextContent("Intrusion");
    expect(screen.getByLabelText("Evidence slot 1")).toBeInTheDocument();
    expect(region).toHaveTextContent("Share with MIO");
    expect(region).toHaveTextContent("Share with Pelaga");
  });

  it("selecting a claim answer updates the draft", async () => {
    const user = userEvent.setup();
    renderConclusion();
    await completeForm(user);
    await user.click(screen.getByRole("button", { name: "Review Report" }));
    expect(screen.getByRole("region", { name: "Conclusion Report" })).toHaveTextContent("Main gate");
  });

  it("valid draft enables Review Report; incomplete is disabled with a warning", async () => {
    const user = userEvent.setup();
    renderConclusion();
    const review = screen.getByRole("button", { name: "Review Report" });
    expect(review).toBeDisabled();
    expect(screen.getByRole("status")).toHaveTextContent("Attach at least 1 pieces of evidence.");
    await completeForm(user);
    expect(review).toBeEnabled();
    expect(screen.queryByRole("status")).not.toBeInTheDocument();
  });

  it("shows the evidence warning when claims and disclosure are set but no evidence is attached", async () => {
    const user = userEvent.setup();
    renderConclusion();
    await user.click(screen.getByRole("radio", { name: "Main gate" }));
    await user.click(screen.getByRole("radio", { name: "Intrusion" }));
    await user.click(screen.getByRole("radio", { name: "Share with MIO" }));
    expect(screen.getByRole("button", { name: "Review Report" })).toBeDisabled();
    expect(screen.getByRole("status")).toHaveTextContent("Attach at least 1 pieces of evidence.");
  });

  it("review shows the composed report summary", async () => {
    const user = userEvent.setup();
    renderConclusion();
    await completeForm(user);
    await user.click(screen.getByRole("button", { name: "Review Report" }));
    const region = screen.getByRole("region", { name: "Conclusion Report" });
    expect(region).toHaveTextContent("Main gate");
    expect(region).toHaveTextContent("Intrusion");
    expect(region).toHaveTextContent("Test evidence");
    expect(region).toHaveTextContent("Share with MIO");
  });

  it("back from review returns to form with the draft retained", async () => {
    const user = userEvent.setup();
    renderConclusion();
    await completeForm(user);
    await user.click(screen.getByRole("button", { name: "Review Report" }));
    await user.click(screen.getByRole("button", { name: "Back" }));
    expect(screen.getByRole("radio", { name: "Main gate" })).toBeChecked();
  });

  it("submit dispatches checkpoint_requested, report_submitted, outcome_selected", async () => {
    const user = userEvent.setup();
    renderConclusion();
    await completeForm(user);
    await submitReport(user);
    expect(eventHistory()).toContain("checkpoint_requested");
    expect(eventHistory()).toContain("report_submitted");
    expect(eventHistory()).toContain("outcome_selected");
  });

  it("correct report yields the protected outcome ending", async () => {
    const user = userEvent.setup();
    renderConclusion();
    await completeForm(user);
    await submitReport(user);
    expect(screen.getByRole("heading", { name: "Protected outcome ending" })).toBeVisible();
    expect(screen.getByTestId("selected-outcome").textContent).toBe("outcome_protected");
  });

  it("wrong answer yields a different ending", async () => {
    const user = userEvent.setup();
    renderConclusion();
    await completeForm(user, "Loading dock");
    await submitReport(user);
    expect(screen.getByRole("heading", { name: "Wrong outcome ending" })).toBeVisible();
  });

  it("outcome view restores from durable state", () => {
    renderConclusion({
      initialState: { selectedOutcomeId: "outcome_protected", caseCompleted: true },
    });
    expect(screen.getByRole("heading", { name: "Protected outcome ending" })).toBeVisible();
    expect(screen.queryByRole("radio")).not.toBeInTheDocument();
  });

  it("applies no correctness styling to option controls", () => {
    renderConclusion();
    const region = screen.getByRole("region", { name: "Conclusion Report" });
    expect(region.querySelectorAll(".bbx-success, .bbx-danger")).toHaveLength(0);
  });

  it("retry dispatches checkpoint_restore_requested", async () => {
    const user = userEvent.setup();
    renderConclusion({
      initialState: { selectedOutcomeId: "outcome_protected", caseCompleted: true },
    });
    await user.click(screen.getByRole("button", { name: "Retry Investigation" }));
    expect(eventHistory()).toContain("checkpoint_restore_requested");
  });

  it("renders locked state without a session", () => {
    render(<ConclusionReportApp />);
    expect(screen.getByRole("region", { name: "Conclusion Report" })).toHaveTextContent(
      "Conclusion Report unavailable",
    );
  });
});
