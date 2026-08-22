import { expect, test } from "@playwright/test";
import { bypassBoot, seedLegacySave } from "./helpers/seed-legacy-save";

// Legacy-save compatibility: a pre-Stage-0 save (trigger_001_bootstrap already
// fired, Stage 1 active, apps unlocked) must restore without re-entering Stage 0.
// The player lands directly in Stage 1: no Stage 0 objective, no onboarding
// briefing mail, Records already unlocked.
test("legacy save: restores directly into Stage 1 and never re-enters Stage 0", async ({ page }) => {
  const pageErrors: string[] = [];
  page.on("pageerror", (error) => pageErrors.push(error.message));
  const consoleErrors: string[] = [];
  page.on("console", (message) => { if (message.type() === "error") consoleErrors.push(message.text()); });

  await bypassBoot(page);
  await page.goto("/game");
  await seedLegacySave(page);
  await page.reload();
  await expect(page.locator('[data-hydration-status="ready"]')).toBeVisible();
  await expect(page.getByText(/case: missing signal/i)).toBeVisible();

  // Stage 1 is active; Stage 0 objective never appears.
  await page.getByRole("button", { name: "Launcher" }).click();
  await page.getByRole("menuitem", { name: "Objectives" }).click();
  const objectives = page.locator('[aria-label="Objectives"]');
  await expect(objectives).toBeVisible();
  await expect(objectives.getByText(/Complete analyst verification/i)).toHaveCount(0);
  await expect(objectives.getByText(/Verify Maya Pranata's final confirmed location/i)).toBeVisible();

  // Mail opens on the Stage 1 intro, not the Stage 0 onboarding briefing.
  await page.getByRole("button", { name: "Launcher" }).click();
  await page.getByRole("menuitem", { name: "Mail" }).click();
  await expect(page.getByText(/Welcome to BLACKBOX/i)).toHaveCount(0);
  await expect(page.getByText(/failed to report for a scheduled emergency maintenance review/i)).toBeVisible();

  expect(pageErrors).toEqual([]);
  expect(consoleErrors).toEqual([]);
});
