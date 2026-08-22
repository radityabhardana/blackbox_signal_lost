import { fireEvent, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it } from "vitest";
import { resetWindowStoreForTests, useWindowStore } from "@/stores/window-store";
import { CaseSessionProvider } from "@/features/session/case-session";
import { createInitialEngineState } from "@/domain/engine";
import { contentBundleSchema } from "@/content/validator";
import bundleJson from "@/content/fixtures/bundles/valid/bundle_basic_valid.json";
import { renderWithProviders } from "@/test/helpers/render";
import { Taskbar } from "./taskbar";

beforeEach(() => {
  resetWindowStoreForTests();
});

describe("Taskbar", () => {
  it("renders the launcher, switcher, notification center, and reset controls", () => {
    renderWithProviders(<Taskbar />);
    expect(screen.getByRole("navigation", { name: /application launcher/i })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Launcher" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Switch window" })).toBeDisabled();
    expect(screen.getByRole("button", { name: "Reset workspace" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Notification center" })).toBeEnabled();
    expect(screen.getByText(/case: none/i)).toBeInTheDocument();
  });

  it("shows decorative glyphs beside the case label and reset button", () => {
    renderWithProviders(<Taskbar />);
    const caseLabel = screen.getByText(/case: none/i);
    expect(caseLabel.closest("span")?.parentElement?.querySelector("svg[aria-hidden='true']")).not.toBeNull();
    const reset = screen.getByRole("button", { name: "Reset workspace" });
    expect(reset.querySelector("svg[aria-hidden='true']")).not.toBeNull();
    expect(reset).toHaveTextContent("Reset workspace");
  });

  it("renders an icon beside the title in an open app's taskbar tab", () => {
    useWindowStore.getState().open("app_mail");
    renderWithProviders(<Taskbar />);
    const tab = screen.getByRole("button", { name: "Mail window, focused" });
    expect(tab.querySelector("svg[aria-hidden='true']")).not.toBeNull();
    expect(tab).toHaveTextContent("Mail");
  });

  it("opens an application from the launcher and shows it in the taskbar", async () => {
    const user = userEvent.setup();
    const content = contentBundleSchema.parse(bundleJson);
    const initialState = { ...createInitialEngineState(), unlockedApplications: ["app_help"] };
    renderWithProviders(
      <CaseSessionProvider content={content} mailChannelId="channel_test" initialState={initialState}>
        <Taskbar />
      </CaseSessionProvider>,
    );
    await user.click(screen.getByRole("button", { name: "Launcher" }));
    await user.click(await screen.findByRole("menuitem", { name: "Help" }));
    expect(screen.getByRole("button", { name: "Help window, focused" })).toBeInTheDocument();
  });

  it("restores a minimized window from its taskbar item", async () => {
    const store = useWindowStore.getState();
    store.open("app_mail");
    store.minimize("win_0");
    const user = userEvent.setup();
    renderWithProviders(<Taskbar />);
    await user.click(screen.getByRole("button", { name: "Mail window, minimized" }));
    expect(useWindowStore.getState().manager.openWindows[0]?.display).toBe("normal");
    expect(useWindowStore.getState().manager.focusedWindowId).toBe("win_0");
  });

  it("brings a background window to the front from its taskbar item", async () => {
    const store = useWindowStore.getState();
    store.open("app_mail");
    store.open("app_records");
    const user = userEvent.setup();
    renderWithProviders(<Taskbar />);
    await user.click(screen.getByRole("button", { name: "Mail window, open" }));
    expect(useWindowStore.getState().manager.focusedWindowId).toBe("win_0");
  });

  it("resets the workspace from the taskbar", () => {
    const store = useWindowStore.getState();
    store.open("app_mail");
    store.toggleMaximize("win_0");
    renderWithProviders(<Taskbar />);
    fireEvent.click(screen.getByRole("button", { name: "Reset workspace" }));
    const state = useWindowStore.getState();
    expect(state.manager.openWindows[0]?.display).toBe("normal");
    expect(state.manager.openWindows[0]?.restoreBounds).toBeNull();
  });
});
