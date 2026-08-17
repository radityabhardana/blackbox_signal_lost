import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it } from "vitest";
import { resetWindowStoreForTests, useWindowStore } from "@/stores/window-store";
import { WindowLayer } from "@/components/windows/window-layer";
import { WindowSwitcher } from "./window-switcher";

beforeEach(() => {
  resetWindowStoreForTests();
});

describe("WindowSwitcher", () => {
  it("is disabled when no windows are open", () => {
    render(<WindowSwitcher />);
    expect(screen.getByRole("button", { name: "Switch window" })).toBeDisabled();
  });

  it("lists only non-minimized windows", async () => {
    const store = useWindowStore.getState();
    store.open("app_mail");
    store.open("app_records");
    store.minimize("win_0");
    const user = userEvent.setup();
    render(<WindowSwitcher />);
    await user.click(screen.getByRole("button", { name: "Switch window" }));
    const items = screen.getAllByRole("menuitem");
    expect(items.map((item) => item.textContent)).toEqual(["Records"]);
    expect(items[0]!.querySelector("svg[aria-hidden='true']")).not.toBeNull();
  });

  it("shows a glyph on the switch trigger while keeping its accessible name", () => {
    const store = useWindowStore.getState();
    store.open("app_mail");
    render(<WindowSwitcher />);
    const trigger = screen.getByRole("button", { name: "Switch window" });
    expect(trigger.querySelector("svg[aria-hidden='true']")).not.toBeNull();
    expect(trigger).toHaveTextContent("Switch window");
  });

  it("focuses the selected window on activation", async () => {
    const store = useWindowStore.getState();
    store.open("app_mail");
    store.open("app_records");
    const user = userEvent.setup();
    render(
      <div>
        <WindowLayer />
        <WindowSwitcher />
      </div>,
    );
    await user.click(screen.getByRole("button", { name: "Switch window" }));
    await user.keyboard("{ArrowDown}");
    const records = screen.getByRole("menuitem", { name: "Records" });
    expect(records).toHaveFocus();
    await user.keyboard("{Enter}");
    expect(useWindowStore.getState().manager.focusedWindowId).toBe("win_1");
    expect(screen.queryByRole("menu", { name: "Open windows" })).not.toBeInTheDocument();
    await waitFor(() =>
      expect(document.activeElement).toBe(screen.getByTestId("window-win_1")),
    );
  });

  it("closes with Escape and returns focus to the trigger", async () => {
    const store = useWindowStore.getState();
    store.open("app_mail");
    store.open("app_records");
    const user = userEvent.setup();
    render(<WindowSwitcher />);
    const trigger = screen.getByRole("button", { name: "Switch window" });
    await user.click(trigger);
    await user.keyboard("{Escape}");
    expect(screen.queryByRole("menu", { name: "Open windows" })).not.toBeInTheDocument();
    expect(trigger).toHaveFocus();
  });
});