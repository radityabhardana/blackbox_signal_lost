import { expect, test } from "@playwright/test";
import { completeStage0 } from "./helpers/seed-legacy-save";

// Mid-stage reload: a session saved mid-Stage-1 (ferry opened, emergency call NOT
// yet opened) must restore partial progress — discovered evidence and the active
// objective survive, and the remaining investigation step still completes.
test("mid-stage later: partial Stage 1 progress survives reload and completes", async ({ page }) => {
  const pageErrors: string[] = [];
  page.on("pageerror", (error) => pageErrors.push(error.message));
  const consoleErrors: string[] = [];
  page.on("console", (message) => { if (message.type() === "error") consoleErrors.push(message.text()); });

  await page.goto("/game");
  await expect(page.locator('[data-hydration-status="ready"]')).toBeVisible();
  await expect(page.getByText(/case: missing signal/i)).toBeVisible();

  await completeStage0(page);

  // Stage 1 partial progress: discover the ferry record only.
  await page.getByRole("button", { name: "Launcher" }).click();
  await page.getByRole("menuitem", { name: "Records" }).click();
  const searchbox = page.getByRole("searchbox", { name: /search records/i });
  await expect(searchbox).toBeVisible();
  await searchbox.fill("ferry");
  await searchbox.press("Enter");
  await page.getByRole("button", { name: /ferry departure record/i }).click();
  await page.getByRole("button", { name: "Back" }).click();
  await expect(page.locator('[data-persistence-status="saved"]')).toBeVisible();

  // Reload mid-stage: partial state persists (obj_001 still active).
  await page.reload();
  await expect(page.locator('[data-hydration-status="ready"]')).toBeVisible();
  await expect(page.getByText(/case: missing signal/i)).toBeVisible();

  if (await page.locator('[aria-label="Records"]').count() === 0) {
    await page.getByRole("button", { name: "Launcher" }).click();
    await page.getByRole("menuitem", { name: "Records" }).click();
  }
  await page.getByRole("button", { name: /Records window,/i }).click();

  // Ferry evidence is retained on the board after the reload.
  await page.getByRole("button", { name: "Launcher" }).click();
  await page.getByRole("menuitem", { name: "Evidence Board" }).click();
  const board = page.locator('[aria-label="Evidence Board"]');
  await expect(board).toBeVisible();
  await expect(board.getByRole("button", { name: /Evidence: Ferry Departure Record/i })).toBeVisible();

  // Finish the remaining step: the emergency call completes Stage 1.
  await page.getByRole("button", { name: /Records window,/i }).click();
  await searchbox.fill("emergency");
  await searchbox.press("Enter");
  await page.getByRole("button", { name: /north barrier emergency call/i }).click();
  await page.getByRole("button", { name: "Back" }).click();

  if (await page.locator('[aria-label="Objectives"]').count() === 0) {
    await page.getByRole("button", { name: "Launcher" }).click();
    await page.getByRole("menuitem", { name: "Objectives" }).click();
  }
  const objectives = page.locator('[aria-label="Objectives"]');
  await expect(objectives.getByText("Completed")).toBeVisible();
  await expect(objectives.getByText(/Determine whether the ferry departure record is authentic/i)).toBeVisible();

  expect(pageErrors).toEqual([]);
  expect(consoleErrors).toEqual([]);
});
