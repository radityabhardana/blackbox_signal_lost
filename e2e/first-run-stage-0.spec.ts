import { expect, test } from "@playwright/test";
import { completeStage0 } from "./helpers/seed-legacy-save";

// Fresh first run drives Stage 0 (analyst identity verification) from the
// empty-workspace home surface through the Mail app, then confirms the Stage 0 →
// Stage 1 handoff (obj_001 becomes active, launcher exposes the gated apps).
test("first run: Stage 0 onboarding completes and hands off to Stage 1", async ({ page }) => {
  const pageErrors: string[] = [];
  page.on("pageerror", (error) => pageErrors.push(error.message));
  const consoleErrors: string[] = [];
  page.on("console", (message) => { if (message.type() === "error") consoleErrors.push(message.text()); });

  await page.goto("/game");
  await expect(page.locator('[data-hydration-status="ready"]')).toBeVisible();

  // Boot overlay presents once on first view; skip it.
  await page.getByRole("button", { name: "Skip to main content" }).click();

  // Workspace home dossier names the case and the Stage 0 objective.
  await expect(page.getByRole("heading", { level: 1, name: "Missing Signal" })).toBeVisible();
  await expect(page.getByText("Complete analyst verification")).toBeVisible();

  await completeStage0(page);

  // Stage 0 → Stage 1: the verification objective completes and Stage 1 activates.
  await page.getByRole("button", { name: "Launcher" }).click();
  await page.getByRole("menuitem", { name: "Objectives" }).click();
  const objectives = page.locator('[aria-label="Objectives"]');
  await expect(objectives).toBeVisible();
  await expect(
    objectives.locator("article", { hasText: /Complete analyst verification/i }).getByText("Completed"),
  ).toBeVisible();
  await expect(
    objectives.locator("article", { hasText: /Verify Maya Pranata's final confirmed location/i }).getByText("Active"),
  ).toBeVisible();

  expect(pageErrors).toEqual([]);
  expect(consoleErrors).toEqual([]);
});
