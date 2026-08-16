import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it } from "vitest";
import { resetWindowStoreForTests, useWindowStore } from "@/stores/window-store";
import { CaseSessionProvider } from "@/features/session/case-session";
import { createInitialEngineState } from "@/domain/engine";
import { contentBundleSchema } from "@/content/validator";
import bundleJson from "@/content/fixtures/bundles/valid/bundle_basic_valid.json";
import { Launcher } from "./launcher";

beforeEach(() => {
  resetWindowStoreForTests();
});

describe("Launcher", () => {
  it("opens a menu listing the six catalog applications", async () => {
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
      "Objectives",
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

describe("Launcher unlock gating", () => {
  function renderWithSession(unlockedApplications: readonly string[]) {
    const content = contentBundleSchema.parse(bundleJson);
    const initialState = { ...createInitialEngineState(), unlockedApplications };
    return render(
      <CaseSessionProvider content={content} mailChannelId="channel_test" initialState={initialState}>
        <Launcher />
      </CaseSessionProvider>,
    );
  }

  it("hides gated app when not unlocked", async () => {
    const user = userEvent.setup();
    renderWithSession([]);
    await user.click(screen.getByRole("button", { name: "Launcher" }));
    expect(screen.queryByRole("menuitem", { name: "Signal Analyzer" })).not.toBeInTheDocument();
    expect(screen.getByRole("menuitem", { name: "Mail" })).toBeInTheDocument();
  });

  it("shows gated app when unlocked", async () => {
    const user = userEvent.setup();
    renderWithSession(["app_signal_analyzer"]);
    await user.click(screen.getByRole("button", { name: "Launcher" }));
    expect(screen.getByRole("menuitem", { name: "Signal Analyzer" })).toBeInTheDocument();
  });
});
