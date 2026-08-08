import { fireEvent, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it } from "vitest";
import { resetWindowStoreForTests, useWindowStore } from "@/stores/window-store";
import { Taskbar } from "./taskbar";

beforeEach(() => {
  resetWindowStoreForTests();
});

describe("Taskbar", () => {
  it("renders the launcher, switcher, and reset controls", () => {
    render(<Taskbar />);
    expect(screen.getByRole("navigation", { name: /application launcher/i })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Launcher" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Switch window" })).toBeDisabled();
    expect(screen.getByRole("button", { name: "Reset workspace" })).toBeInTheDocument();
    expect(screen.getByText(/case: none/i)).toBeInTheDocument();
  });

  it("opens an application from the launcher and shows it in the taskbar", async () => {
    const user = userEvent.setup();
    render(<Taskbar />);
    await user.click(screen.getByRole("button", { name: "Launcher" }));
    await user.click(await screen.findByRole("menuitem", { name: "Mail" }));
    expect(screen.getByRole("button", { name: "Mail window, focused" })).toBeInTheDocument();
  });

  it("restores a minimized window from its taskbar item", async () => {
    const store = useWindowStore.getState();
    store.open("app_mail");
    store.minimize("win_0");
    const user = userEvent.setup();
    render(<Taskbar />);
    await user.click(screen.getByRole("button", { name: "Mail window, minimized" }));
    expect(useWindowStore.getState().manager.openWindows[0]?.display).toBe("normal");
    expect(useWindowStore.getState().manager.focusedWindowId).toBe("win_0");
  });

  it("brings a background window to the front from its taskbar item", async () => {
    const store = useWindowStore.getState();
    store.open("app_mail");
    store.open("app_records");
    const user = userEvent.setup();
    render(<Taskbar />);
    await user.click(screen.getByRole("button", { name: "Mail window, open" }));
    expect(useWindowStore.getState().manager.focusedWindowId).toBe("win_0");
  });

  it("resets the workspace from the taskbar", () => {
    const store = useWindowStore.getState();
    store.open("app_mail");
    store.toggleMaximize("win_0");
    render(<Taskbar />);
    fireEvent.click(screen.getByRole("button", { name: "Reset workspace" }));
    const state = useWindowStore.getState();
    expect(state.manager.openWindows[0]?.display).toBe("normal");
    expect(state.manager.openWindows[0]?.restoreBounds).toBeNull();
  });
});