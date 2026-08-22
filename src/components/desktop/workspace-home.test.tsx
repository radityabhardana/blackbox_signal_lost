import { fireEvent, screen } from "@testing-library/react";
import { beforeEach, describe, expect, it } from "vitest";
import { resetWindowStoreForTests, useWindowStore } from "@/stores/window-store";
import { CaseSessionProvider } from "@/features/session/case-session";
import { loadCase001Session } from "@/content/cases/case_001_missing_signal";
import { renderWithProviders } from "@/test/helpers/render";
import { WorkspaceHome } from "./workspace-home";

function renderHome(initialState = loadCase001Session().initialState) {
  const { content } = loadCase001Session();
  return renderWithProviders(
    <CaseSessionProvider content={content} mailChannelId="channel_001_mail" initialState={initialState}>
      <WorkspaceHome />
    </CaseSessionProvider>,
  );
}

beforeEach(() => {
  resetWindowStoreForTests();
});

describe("WorkspaceHome", () => {
  it("renders the case dossier with title and active objective", () => {
    renderHome();
    expect(screen.getByRole("heading", { name: "Missing Signal" })).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: "Complete analyst verification" })).toBeInTheDocument();
    expect(screen.getByText(/review your analyst credential/i)).toBeInTheDocument();
  });

  it("renders a dominant contextual action for the quick action app", () => {
    renderHome();
    const primary = document.querySelector(".bbx-btn-primary") as HTMLButtonElement;
    expect(primary).not.toBeNull();
    expect(primary.textContent).toContain("Open Mail");
  });

  it("opens the quick action app on activation via keyboard", () => {
    renderHome();
    const primary = document.querySelector(".bbx-btn-primary") as HTMLButtonElement;
    primary.focus();
    fireEvent.click(primary);
    expect(useWindowStore.getState().manager.openWindows[0]?.appId).toBe("app_mail");
  });

  it("lists available apps with individualized open labels", () => {
    renderHome();
    expect(screen.queryByRole("button", { name: "Open Record" })).not.toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Open Help" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Open Settings" })).toBeInTheDocument();
  });

  it("shows a restrained CASE CLOSED state when the case is complete", () => {
    const { content, initialState } = loadCase001Session();
    renderWithProviders(
      <CaseSessionProvider
        content={content}
        mailChannelId="channel_001_mail"
        initialState={{ ...initialState, caseCompleted: true, activeObjectives: [], queuedDialogue: [], notifications: [] }}
      >
        <WorkspaceHome />
      </CaseSessionProvider>,
    );
    expect(screen.getByRole("heading", { name: "Missing Signal" })).toBeInTheDocument();
    expect(screen.getByText("CASE CLOSED")).toBeInTheDocument();
    expect(document.querySelector(".bbx-btn-primary")).toBeNull();
  });

  it("renders nothing for a session-less shell", () => {
    renderWithProviders(<WorkspaceHome />);
    expect(screen.queryByTestId("workspace-home")).not.toBeInTheDocument();
    expect(screen.getByText(/workspace ready/i)).toBeInTheDocument();
  });
});