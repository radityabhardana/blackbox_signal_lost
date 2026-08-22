import { screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it } from "vitest";
import { resetWindowStoreForTests, useWindowStore } from "@/stores/window-store";
import { CaseSessionProvider } from "@/features/session/case-session";
import { createInitialEngineState } from "@/domain/engine";
import { contentBundleSchema } from "@/content/validator";
import bundleJson from "@/content/fixtures/bundles/valid/bundle_basic_valid.json";
import { renderWithProviders } from "@/test/helpers/render";
import { Launcher } from "./launcher";

beforeEach(() => {
  resetWindowStoreForTests();
});

/**
 * All catalog apps unlocked — mirrors the Stage 1 bootstrap trigger
 * (trigger_001_bootstrap) plus signal analyzer and conclusion.
 */
const ALL_APPS_UNLOCKED: readonly string[] = [
  "app_mail",
  "app_messenger",
  "app_records",
  "app_evidence_board",
  "app_objectives",
  "app_signal_analyzer",
  "app_conclusion",
];

describe("Launcher", () => {
  function renderWithSession(unlockedApplications: readonly string[]) {
    const content = contentBundleSchema.parse(bundleJson);
    const initialState = { ...createInitialEngineState(), unlockedApplications };
    return renderWithProviders(
      <CaseSessionProvider content={content} mailChannelId="channel_test" initialState={initialState}>
        <Launcher />
      </CaseSessionProvider>,
    );
  }

  it("opens a menu listing every application when all are unlocked", async () => {
    const user = userEvent.setup();
    renderWithSession(ALL_APPS_UNLOCKED);
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
      "Signal Analyzer",
      "Conclusion Report",
      "System Log",
      "Settings",
      "Help",
    ]);
    expect(items.every((item) => item.querySelector("svg[aria-hidden='true']") !== null)).toBe(true);
  });

  it("only lists the three always-available applications when nothing is unlocked", async () => {
    const user = userEvent.setup();
    renderWithSession([]);
    await user.click(screen.getByRole("button", { name: "Launcher" }));
    const items = screen.getAllByRole("menuitem");
    expect(items.map((item) => item.textContent)).toEqual(["System Log", "Settings", "Help"]);
    expect(items.every((item) => item.querySelector("svg[aria-hidden='true']") !== null)).toBe(true);
  });

  it("shows the BlackboxSymbol mark beside the trigger's Launcher label", () => {
    renderWithSession([]);
    const trigger = screen.getByRole("button", { name: "Launcher" });
    expect(trigger.querySelector("svg[aria-hidden='true']")).not.toBeNull();
    expect(trigger).toHaveTextContent("Launcher");
  });

  it("launches an application on activation", async () => {
    const user = userEvent.setup();
    renderWithSession(ALL_APPS_UNLOCKED);
    await user.click(screen.getByRole("button", { name: "Launcher" }));
    await user.click(await screen.findByRole("menuitem", { name: "Mail" }));
    expect(useWindowStore.getState().manager.openWindows[0]?.appId).toBe("app_mail");
    expect(screen.queryByRole("menu", { name: "Applications" })).not.toBeInTheDocument();
  });

  it("supports arrow-key navigation and activation with Enter", async () => {
    const user = userEvent.setup();
    renderWithSession(ALL_APPS_UNLOCKED);
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
    renderWithSession(ALL_APPS_UNLOCKED);
    const trigger = screen.getByRole("button", { name: "Launcher" });
    await user.click(trigger);
    await user.keyboard("{Escape}");
    expect(screen.queryByRole("menu", { name: "Applications" })).not.toBeInTheDocument();
    expect(trigger).toHaveFocus();
    expect(trigger).toHaveAttribute("aria-expanded", "false");
  });
});

describe("Launcher unlock gating", () => {
  function renderWithUnlocked(unlockedApplications: readonly string[]) {
    const content = contentBundleSchema.parse(bundleJson);
    const initialState = { ...createInitialEngineState(), unlockedApplications };
    return renderWithProviders(
      <CaseSessionProvider content={content} mailChannelId="channel_test" initialState={initialState}>
        <Launcher />
      </CaseSessionProvider>,
    );
  }

  it("does not reveal the conclusion report when locked", async () => {
    const user = userEvent.setup();
    renderWithUnlocked(["app_mail"]); // only mail unlocked / signal unlocked
    await user.click(screen.getByRole("button", { name: "Launcher" }));
    expect(screen.queryByRole("menuitem", { name: "Conclusion Report" })).not.toBeInTheDocument();
    expect(screen.queryByRole("menuitem", { name: "Signal Analyzer" })).not.toBeInTheDocument();
    expect(screen.getByRole("menuitem", { name: "Mail" })).toBeInTheDocument();
  });

  it("shows the conclusion report when unlocked", async () => {
    const user = userEvent.setup();
    renderWithUnlocked([...ALL_APPS_UNLOCKED]);
    await user.click(screen.getByRole("button", { name: "Launcher" }));
    expect(screen.getByRole("menuitem", { name: "Conclusion Report" })).toBeInTheDocument();
    expect(screen.getByRole("menuitem", { name: "Signal Analyzer" })).toBeInTheDocument();
  });
});
