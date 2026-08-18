import { screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import { contentBundleSchema } from "@/content/validator";
import { CaseSessionProvider } from "@/features/session/case-session";
import { EvidenceBoardProvider } from "@/features/evidence-board/evidence-board-provider";
import { createEvidenceBoardTestSession } from "@/test/fixtures/evidence-board-content";
import { renderWithProviders } from "@/test/helpers/render";
import { EvidenceBoardApp } from "./evidence-board-app";

vi.mock("./evidence-board-canvas", () => ({
  EvidenceBoardCanvas: ({ onSelectNode, onSelectEdge }: { onSelectNode: (id: string) => void; onSelectEdge: (id: string) => void }) => <div data-testid="evidence-board-canvas"><button type="button" onClick={() => onSelectNode("note_0")}>Select note</button><button type="button" onClick={() => onSelectEdge("edge_0")}>Select edge</button></div>,
}));

function renderApp() {
  const fixture = createEvidenceBoardTestSession();
  renderWithProviders(<CaseSessionProvider content={fixture.content} mailChannelId="channel_test" initialState={fixture.initialState}><EvidenceBoardProvider><EvidenceBoardApp /></EvidenceBoardProvider></CaseSessionProvider>);
}

describe("EvidenceBoardApp", () => {
  it("renders the honest no-session state", () => {
    renderWithProviders(<EvidenceBoardProvider><EvidenceBoardApp /></EvidenceBoardProvider>);
    expect(screen.getByText("No active case")).toBeVisible();
  });

  it("adds a note and creates an accessible player hypothesis without engine mutation", async () => {
    const user = userEvent.setup();
    renderApp();
    await user.type(screen.getByLabelText("New private note"), "  Field note  ");
    await user.click(screen.getByRole("button", { name: "Add private note" }));
    await user.click(screen.getByRole("button", { name: /Note: Field note/ }));
    await user.selectOptions(screen.getByLabelText("Connect selected node"), "evidence:evidence_test");
    await user.click(screen.getByRole("button", { name: "Create player hypothesis" }));
    expect(screen.getByText(/Player hypothesis/)).toBeVisible();
  });

  it("keeps private notes available before evidence is discovered", async () => {
    const user = userEvent.setup();
    const fixture = createEvidenceBoardTestSession();
    const emptyState = { ...fixture.initialState, discoveredEntityIds: [] };
    renderWithProviders(<CaseSessionProvider content={fixture.content} mailChannelId="channel_test" initialState={emptyState}><EvidenceBoardProvider><EvidenceBoardApp /></EvidenceBoardProvider></CaseSessionProvider>);
    await user.type(screen.getByLabelText("New private note"), "Early note");
    await user.click(screen.getByRole("button", { name: "Add private note" }));
    expect(screen.getByRole("button", { name: "Note: Early note" })).toBeVisible();
  });

  it("clears local note and edge selections after explicit deletion", async () => {
    const user = userEvent.setup();
    renderApp();
    await user.type(screen.getByLabelText("New private note"), "Delete me");
    await user.click(screen.getByRole("button", { name: "Add private note" }));
    await user.click(screen.getByRole("button", { name: "Select note" }));
    await user.click(screen.getByRole("button", { name: "Delete note" }));
    expect(screen.queryByRole("region", { name: "Selected board node" })).not.toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: "Evidence: Test evidence" }));
    await user.selectOptions(screen.getByLabelText("Connect selected node"), "evidence:evidence_board_test_second");
    await user.click(screen.getByRole("button", { name: "Create player hypothesis" }));
    await user.click(screen.getByRole("button", { name: "Select edge" }));
    await user.click(screen.getByRole("button", { name: "Remove player hypothesis" }));
    expect(screen.queryByRole("region", { name: "Selected player hypothesis" })).not.toBeInTheDocument();
  });

  it("clears a reconciled evidence selection before the same id reappears", async () => {
    const fixture = createEvidenceBoardTestSession();
    const withoutEvidence = contentBundleSchema.parse({ ...fixture.content, evidence: fixture.content.evidence.filter((evidence) => evidence.id !== "evidence_test") });
    const view = renderWithProviders(<CaseSessionProvider content={fixture.content} mailChannelId="channel_test" initialState={fixture.initialState}><EvidenceBoardProvider><EvidenceBoardApp /></EvidenceBoardProvider></CaseSessionProvider>);
    await userEvent.click(screen.getByRole("button", { name: "Evidence: Test evidence" }));
    expect(screen.getByRole("region", { name: "Selected board node" })).toBeVisible();
    view.rerender(<CaseSessionProvider content={withoutEvidence} mailChannelId="channel_test" initialState={fixture.initialState}><EvidenceBoardProvider><EvidenceBoardApp /></EvidenceBoardProvider></CaseSessionProvider>);
    await waitFor(() => expect(screen.queryByRole("region", { name: "Selected board node" })).not.toBeInTheDocument());
    view.rerender(<CaseSessionProvider content={fixture.content} mailChannelId="channel_test" initialState={fixture.initialState}><EvidenceBoardProvider><EvidenceBoardApp /></EvidenceBoardProvider></CaseSessionProvider>);
    await waitFor(() => expect(screen.getByRole("button", { name: "Evidence: Test evidence" })).toHaveAttribute("aria-pressed", "false"));
    expect(screen.queryByRole("region", { name: "Selected board node" })).not.toBeInTheDocument();
  });

  it("shares board edits while retaining selection independently in mounted app instances", async () => {
    const user = userEvent.setup();
    const fixture = createEvidenceBoardTestSession();
    renderWithProviders(<CaseSessionProvider content={fixture.content} mailChannelId="channel_test" initialState={fixture.initialState}><EvidenceBoardProvider><EvidenceBoardApp /><EvidenceBoardApp /></EvidenceBoardProvider></CaseSessionProvider>);
    const [appA, appB] = screen.getAllByRole("region", { name: "Evidence Board" });
    await user.type(within(appA!).getByLabelText("New private note"), "Shared note");
    await user.click(within(appA!).getByRole("button", { name: "Add private note" }));
    expect(within(appB!).getByRole("button", { name: "Note: Shared note" })).toBeVisible();
    await user.click(within(appA!).getByRole("button", { name: "Evidence: Test evidence" }));
    expect(within(appA!).getByRole("button", { name: "Evidence: Test evidence" })).toHaveAttribute("aria-pressed", "true");
    expect(within(appB!).queryByRole("region", { name: "Selected board node" })).not.toBeInTheDocument();
    await user.click(within(appB!).getByRole("button", { name: "Evidence: Second board evidence" }));
    expect(within(appB!).getByRole("button", { name: "Evidence: Second board evidence" })).toHaveAttribute("aria-pressed", "true");
    expect(within(appA!).getByRole("button", { name: "Evidence: Test evidence" })).toHaveAttribute("aria-pressed", "true");
  });
});
