import { expect, test } from "@playwright/test";

// Workspace-home E2E: the empty-workspace case dossier renders the Stage 0
// objective and its quick action, and opening its recommended app (Mail) replaces the
// dossier with a window that is reachable from the taskbar.
test("workspace home: dossier shows Stage 0 objective and quick action opens Mail", async ({ page }) => {
  const pageErrors: string[] = [];
  page.on("pageerror", (error) => pageErrors.push(error.message));
  const consoleErrors: string[] = [];
  page.on("console", (message) => { if (message.type() === "error") consoleErrors.push(message.text()); });

  await page.goto("/game");
  await expect(page.locator('[data-hydration-status="ready"]')).toBeVisible();

  // Skip the boot overlay to reach the dossier.
  await page.getByRole("button", { name: "Skip to main content" }).click();

  // Case dossier names the case and the Stage 0 objective.
  await expect(page.getByRole("heading", { level: 1, name: "Missing Signal" })).toBeVisible();
  await expect(page.getByText("Complete analyst verification")).toBeVisible();

  // The dossier shows the active-objective heading and the briefing attention line.
  await expect(page.getByText("OBJECTIVE")).toBeVisible();
  await expect(page.getByText("NEW BRIEFING RECEIVED")).toBeVisible();

  // Quick action opens the recommended Mail app, replacing the empty workspace.
  await page.getByRole("button", { name: "Open Mail" }).click();
  await expect(page.getByRole("button", { name: /Mail window, focused/i })).toBeVisible();

  expect(pageErrors).toEqual([]);
  expect(consoleErrors).toEqual([]);
});
