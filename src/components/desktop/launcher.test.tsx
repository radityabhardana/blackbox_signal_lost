import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it } from "vitest";
import { resetWindowStoreForTests, useWindowStore } from "@/stores/window-store";
import { Launcher } from "./launcher";

beforeEach(() => {
  resetWindowStoreForTests();
});

describe("Launcher", () => {
  it("opens a menu listing the four placeholder applications", async () => {
    const user = userEvent.setup();
    render(<Launcher />);
    const trigger = screen.getByRole("button", { name: "Launcher" });
    await user.click(trigger);
    expect(trigger).toHaveAttribute("aria-expanded", "true");
    expect(screen.getByRole("menu", { name: "Applications" })).toBeInTheDocument();
    const items = screen.getAllByRole("menuitem");
    expect(items.map((item) => item.textContent)).toEqual([
      "Mail",
      "Messenger",
      "Records",
      "Evidence Board",
      "System Log",
    ]);
  });

  it("launches an application on activation", async () => {
    const user = userEvent.setup();
    render(<Launcher />);
    await user.click(screen.getByRole("button", { name: "Launcher" }));
    await user.click(await screen.findByRole("menuitem", { name: "Mail" }));
    expect(useWindowStore.getState().manager.openWindows[0]?.appId).toBe("app_mail");
    expect(screen.queryByRole("menu", { name: "Applications" })).not.toBeInTheDocument();
  });

  it("supports arrow-key navigation and activation with Enter", async () => {
    const user = userEvent.setup();
    render(<Launcher />);
    await user.click(screen.getByRole("button", { name: "Launcher" }));
    const mail = await screen.findByRole("menuitem", { name: "Mail" });
    await waitFor(() => expect(mail).toHaveFocus());
    await user.keyboard("{ArrowDown}");
    expect(screen.getByRole("menuitem", { name: "Messenger" })).toHaveFocus();
    await user.keyboard("{Enter}");
    expect(useWindowStore.getState().manager.openWindows[0]?.appId).toBe("app_messenger");
  });

  it("closes with Escape and returns focus to the trigger", async () => {
    const user = userEvent.setup();
    render(<Launcher />);
    const trigger = screen.getByRole("button", { name: "Launcher" });
    await user.click(trigger);
    await user.keyboard("{Escape}");
    expect(screen.queryByRole("menu", { name: "Applications" })).not.toBeInTheDocument();
    expect(trigger).toHaveFocus();
    expect(trigger).toHaveAttribute("aria-expanded", "false");
  });
});
