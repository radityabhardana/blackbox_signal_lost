import { screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it } from "vitest";

import { CaseSessionProvider, useCaseSession } from "@/features/session/case-session";
import { createInitialEngineState } from "@/domain/engine";
import type { CaseEngineState } from "@/domain/engine";
import { contentBundleSchema } from "@/content/validator";
import type { ContentBundle } from "@/content/validator";
import type { HintDefinition, ObjectiveDefinition } from "@/content/schemas";
import bundleJson from "@/content/fixtures/bundles/valid/bundle_basic_valid.json";
import { renderWithProviders } from "@/test/helpers/render";
import { ObjectivesApp } from "./objectives-app";

function renderWithSession(initialStateOverrides: Partial<CaseEngineState> = {}) {
  const content = contentBundleSchema.parse(bundleJson);
  const initialState = { ...createInitialEngineState(), ...initialStateOverrides };
  return renderWithProviders(
    <CaseSessionProvider content={content} mailChannelId="channel_test" initialState={initialState}>
      <ObjectivesApp />
    </CaseSessionProvider>,
  );
}

function renderWithObjectives(extraObjectives: readonly ObjectiveDefinition[]) {
  const baseContent = contentBundleSchema.parse(bundleJson);
  const content: ContentBundle = {
    ...baseContent,
    case: { ...baseContent.case, objectives: [...baseContent.case.objectives, ...extraObjectives] },
  };
  const initialState = { ...createInitialEngineState(), activeObjectives: ["objective_optional"] };
  return renderWithProviders(
    <CaseSessionProvider content={content} mailChannelId="channel_test" initialState={initialState}>
      <ObjectivesApp />
    </CaseSessionProvider>,
  );
}

describe("ObjectivesApp no-session empty state", () => {
  it("renders No objectives without a session", () => {
    renderWithProviders(<ObjectivesApp />);
    expect(screen.getByRole("region", { name: "Objectives" })).toHaveTextContent("No objectives");
  });
});

describe("ObjectivesApp with session", () => {
  it("renders accessible region", () => {
    renderWithSession();
    expect(screen.getByRole("region", { name: "Objectives" })).toBeInTheDocument();
  });

  it("renders locked objective when not started", () => {
    renderWithSession();
    const article = screen.getByText("Test objective").closest("article")!;
    expect(article).toHaveTextContent("Locked");
  });

  it("renders active objective from engine state", () => {
    renderWithSession({ activeObjectives: ["objective_test"] });
    expect(screen.getByText("Test objective")).toBeVisible();
    expect(screen.getByText("Active")).toBeInTheDocument();
  });

  it("renders completed objective", () => {
    renderWithSession({ completedObjectives: ["objective_test"] });
    expect(screen.getByText("Completed")).toBeInTheDocument();
  });

  it("completed objectives are visually distinguished", () => {
    renderWithSession({ completedObjectives: ["objective_test"] });
    const article = screen.getByText("Completed").closest("article");
    expect(article).toHaveClass("opacity-70");
  });

  it("shows optional marker for optional objectives", () => {
    renderWithObjectives([
      {
        id: "objective_optional",
        title: "Optional objective",
        description: "An optional objective.",
        optional: true,
        startRule: { always: true },
        completionRule: { always: true },
        hintIds: [],
        nextObjectiveIds: [],
      },
    ]);
    expect(screen.getByText("Optional objective")).toBeVisible();
    expect(screen.getByText("Active · Optional")).toBeInTheDocument();
  });
});

// ---------------------------------------------------------------------------
// Hint ladder fixtures
// ---------------------------------------------------------------------------

const HINT_OBJECTIVE_ID = "objective_hint";
const LADDER_HINT_IDS = ["hint_ladder_1", "hint_ladder_2", "hint_ladder_3", "hint_ladder_4"] as const;

const LADDER_HINTS: readonly HintDefinition[] = [
  { id: "hint_ladder_1", objectiveId: HINT_OBJECTIVE_ID, tier: 1, text: "Refocus text one" },
  { id: "hint_ladder_2", objectiveId: HINT_OBJECTIVE_ID, tier: 2, text: "Direction text two" },
  { id: "hint_ladder_3", objectiveId: HINT_OBJECTIVE_ID, tier: 3, text: "Connection text three" },
  { id: "hint_ladder_4", objectiveId: HINT_OBJECTIVE_ID, tier: 4, text: "Answer path text four" },
];

/** Test-only probe: exposes the authoritative revealedHintIds for assertions. */
function EngineStateProbe() {
  const session = useCaseSession();
  return <output data-testid="revealed-hints">{session.state.revealedHintIds.join(",")}</output>;
}

function renderHintLadder(options: {
  initialStateOverrides?: Partial<CaseEngineState>;
  objectiveHintIds?: readonly string[];
  hints?: readonly HintDefinition[];
  withProbe?: boolean;
} = {}) {
  const baseContent = contentBundleSchema.parse(bundleJson);
  const hintObjective: ObjectiveDefinition = {
    id: HINT_OBJECTIVE_ID,
    title: "Hint objective",
    description: "Objective with a hint ladder.",
    optional: false,
    startRule: { always: true },
    completionRule: { always: true },
    hintIds: [...(options.objectiveHintIds ?? LADDER_HINT_IDS)],
    nextObjectiveIds: [],
  };
  const content: ContentBundle = {
    ...baseContent,
    case: { ...baseContent.case, objectives: [hintObjective] },
    hints: [...(options.hints ?? LADDER_HINTS)],
  };
  const initialState: CaseEngineState = {
    ...createInitialEngineState(),
    activeObjectives: [HINT_OBJECTIVE_ID],
    ...options.initialStateOverrides,
  };
  return renderWithProviders(
    <CaseSessionProvider content={content} mailChannelId="channel_test" initialState={initialState}>
      {options.withProbe ? <EngineStateProbe /> : null}
      <ObjectivesApp />
    </CaseSessionProvider>,
  );
}

describe("ObjectivesApp hint ladder", () => {
  it("renders a Hint button with the first tier label on an active objective", () => {
    renderHintLadder();
    expect(screen.getByText("Hint objective")).toBeVisible();
    expect(screen.getByRole("button", { name: "Hint (Refocus)" })).toBeInTheDocument();
  });

  it("clicking the hint button reveals the first hint and advances the label", async () => {
    const user = userEvent.setup();
    renderHintLadder();

    await user.click(screen.getByRole("button", { name: "Hint (Refocus)" }));

    expect(screen.getByRole("button", { name: "Hint (Direction)" })).toBeInTheDocument();
    expect(screen.getByText("[Refocus] Refocus text one")).toBeInTheDocument();
  });

  it("sequentially reveals all four tiers then shows exhausted state", async () => {
    const user = userEvent.setup();
    renderHintLadder();

    for (const label of ["Hint (Refocus)", "Hint (Direction)", "Hint (Connection)", "Hint (Answer path)"]) {
      await user.click(screen.getByRole("button", { name: label }));
    }

    expect(screen.queryByRole("button", { name: /Hint/ })).not.toBeInTheDocument();
    expect(screen.getByText("All hints revealed")).toBeInTheDocument();
    expect(screen.getAllByRole("listitem")).toHaveLength(5); // 1 objective li + 4 hint history li
  });

  it("revealed history renders tier label + text for each revealed hint", () => {
    renderHintLadder({
      initialStateOverrides: { revealedHintIds: ["hint_ladder_1", "hint_ladder_2"] },
    });
    expect(screen.getByText("[Refocus] Refocus text one")).toBeInTheDocument();
    expect(screen.getByText("[Direction] Direction text two")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Hint (Connection)" })).toBeInTheDocument();
  });

  it("completed objective shows history only, no reveal button", () => {
    renderHintLadder({
      initialStateOverrides: {
        activeObjectives: [],
        completedObjectives: [HINT_OBJECTIVE_ID],
        revealedHintIds: ["hint_ladder_1"],
      },
    });
    expect(screen.getByText("Completed")).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: /Hint/ })).not.toBeInTheDocument();
    expect(screen.getByText("[Refocus] Refocus text one")).toBeInTheDocument();
  });

  it("locked objective shows no hint affordance", () => {
    renderHintLadder({
      initialStateOverrides: { activeObjectives: [], completedObjectives: [] },
    });
    expect(screen.queryByRole("button", { name: /Hint/ })).not.toBeInTheDocument();
    expect(screen.queryByText(/\[/)).not.toBeInTheDocument();
  });

  it("objective with no authored hints shows no hint affordance", () => {
    renderHintLadder({ objectiveHintIds: [] });
    expect(screen.queryByRole("button", { name: /Hint/ })).not.toBeInTheDocument();
    expect(screen.queryByText(/\[/)).not.toBeInTheDocument();
    expect(screen.queryByText("All hints revealed")).not.toBeInTheDocument();
  });

  it("hint reveal dispatches the hint_revealed engine input", async () => {
    const user = userEvent.setup();
    renderHintLadder({ withProbe: true });

    await user.click(screen.getByRole("button", { name: "Hint (Refocus)" }));

    expect(screen.getByTestId("revealed-hints").textContent).toBe("hint_ladder_1");
  });

  it("history order is authored tier order", () => {
    renderHintLadder({
      initialStateOverrides: { revealedHintIds: ["hint_ladder_4", "hint_ladder_1"] },
    });
    const items = screen.getAllByRole("listitem");
    expect(items[1]).toHaveTextContent("[Refocus]");
    expect(items[2]).toHaveTextContent("[Answer path]");
  });
});
