import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { CaseSessionProvider } from "@/features/session/case-session";
import { createInitialEngineState } from "@/domain/engine";
import type { CaseEngineState } from "@/domain/engine";
import { contentBundleSchema } from "@/content/validator";
import type { ContentBundle } from "@/content/validator";
import type { ObjectiveDefinition } from "@/content/schemas";
import bundleJson from "@/content/fixtures/bundles/valid/bundle_basic_valid.json";
import { ObjectivesApp } from "./objectives-app";

function renderWithSession(initialStateOverrides: Partial<CaseEngineState> = {}) {
  const content = contentBundleSchema.parse(bundleJson);
  const initialState = { ...createInitialEngineState(), ...initialStateOverrides };
  return render(
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
  return render(
    <CaseSessionProvider content={content} mailChannelId="channel_test" initialState={initialState}>
      <ObjectivesApp />
    </CaseSessionProvider>,
  );
}

describe("ObjectivesApp no-session empty state", () => {
  it("renders No objectives without a session", () => {
    render(<ObjectivesApp />);
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
