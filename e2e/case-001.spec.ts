import { expect, test } from "@playwright/test";

test("production /game: Case 001 investigation loop survives reload", async ({ page }) => {
  const pageErrors: string[] = [];
  page.on("pageerror", (error) => pageErrors.push(error.message));
  const consoleErrors: string[] = [];
  page.on("console", (message) => { if (message.type() === "error") consoleErrors.push(message.text()); });

  await page.goto("/game");
  await expect(page.locator('[data-hydration-status="ready"]')).toBeVisible();
  await expect(page.getByText(/case: missing signal/i)).toBeVisible();

  // Open Objective Tracker; assert active objective.
  // The window frame is a section labelled by the app title, so it is also a
  // region named "Objectives"; scope to the app's inner region via its
  // aria-label attribute to avoid strict-mode duplicates.
  await page.getByRole("button", { name: "Launcher" }).click();
  await page.getByRole("menuitem", { name: "Objectives" }).click();
  const objectives = page.locator('[aria-label="Objectives"]');
  await expect(objectives).toBeVisible();
  await expect(objectives.getByText("Active")).toBeVisible();
  await expect(objectives.getByText(/Verify Maya Pranata's final confirmed location/i)).toBeVisible();

  // Open Records; discover ferry departure evidence via record_opened
  await page.getByRole("button", { name: "Launcher" }).click();
  await page.getByRole("menuitem", { name: "Records" }).click();
  const searchbox = page.getByRole("searchbox", { name: /search records/i });
  await expect(searchbox).toBeVisible();
  await searchbox.fill("ferry");
  await searchbox.press("Enter");
  await page.getByRole("button", { name: /ferry departure record/i }).click();
  await page.getByRole("button", { name: "Back" }).click();

  // Discover emergency call evidence; objective completes via authored trigger
  await searchbox.fill("emergency");
  await searchbox.press("Enter");
  await page.getByRole("button", { name: /north barrier emergency call/i }).click();
  await page.getByRole("button", { name: "Back" }).click();

  // Evidence Board reflects both discoveries
  await page.getByRole("button", { name: "Launcher" }).click();
  await page.getByRole("menuitem", { name: "Evidence Board" }).click();
  const board = page.locator('[aria-label="Evidence Board"]');
  await expect(board).toBeVisible();
  await expect(board.getByRole("button", { name: /Evidence: Ferry Departure Record/i })).toBeVisible();
  await expect(board.getByRole("button", { name: /Evidence: North Barrier Emergency Call Metadata/i })).toBeVisible();

  // Objectives show completed; Active gone (same window re-renders reactively)
  await expect(objectives.getByText("Completed")).toBeVisible();
  await expect(objectives.getByText("Active")).toHaveCount(0);

  // Canonical board edit; wait for persistence
  await board.getByLabel("New private note").fill("Maya cannot be both on the ferry and at North Barrier.");
  await board.getByRole("button", { name: "Add private note" }).click();
  await expect(page.locator('[data-persistence-status="saved"]')).toBeVisible();

  // Reload and re-hydrate
  await page.reload();
  await expect(page.locator('[data-hydration-status="ready"]')).toBeVisible();
  await expect(page.getByText(/case: missing signal/i)).toBeVisible();

  // Windows may restore from layout persistence; reopen if needed
  if (await page.locator('[aria-label="Evidence Board"]').count() === 0) {
    await page.getByRole("button", { name: "Launcher" }).click();
    await page.getByRole("menuitem", { name: "Evidence Board" }).click();
  }
  if (await page.locator('[aria-label="Objectives"]').count() === 0) {
    await page.getByRole("button", { name: "Launcher" }).click();
    await page.getByRole("menuitem", { name: "Objectives" }).click();
  }

  // Restored state: objective completed, discoveries and note intact
  const restoredObjectives = page.locator('[aria-label="Objectives"]');
  await expect(restoredObjectives.getByText("Completed")).toBeVisible();
  await expect(restoredObjectives.getByText("Active")).toHaveCount(0);
  const restoredBoard = page.locator('[aria-label="Evidence Board"]');
  await expect(restoredBoard.getByRole("button", { name: /Evidence: Ferry Departure Record/i })).toBeVisible();
  await expect(restoredBoard.getByRole("button", { name: /Evidence: North Barrier Emergency Call Metadata/i })).toBeVisible();
  await expect(restoredBoard.getByRole("button", { name: /Note: Maya cannot be both on the ferry and at North Barrier/i })).toBeVisible();

  expect(pageErrors).toEqual([]);
  expect(consoleErrors).toEqual([]);
});
