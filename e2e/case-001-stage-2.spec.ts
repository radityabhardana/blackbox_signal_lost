import { expect, test } from "@playwright/test";

test("production /game: Case 001 Stage 1 to Stage 2 signal analyzer flow survives reload", async ({ page }) => {
  const pageErrors: string[] = [];
  page.on("pageerror", (error) => pageErrors.push(error.message));
  const consoleErrors: string[] = [];
  page.on("console", (message) => { if (message.type() === "error") consoleErrors.push(message.text()); });

  await page.goto("/game");
  await expect(page.locator('[data-hydration-status="ready"]')).toBeVisible();
  await expect(page.getByText(/case: missing signal/i)).toBeVisible();

  // Open Objective Tracker; assert the active Stage 1 objective.
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

  // Discover emergency call evidence; the same engine step completes obj_001,
  // starts obj_002, and unlocks the Signal Analyzer.
  await searchbox.fill("emergency");
  await searchbox.press("Enter");
  await page.getByRole("button", { name: /north barrier emergency call/i }).click();
  await page.getByRole("button", { name: "Back" }).click();

  // Objectives show Stage 1 completed and Stage 2 active
  await expect(objectives.getByText("Completed")).toBeVisible();
  await expect(objectives.getByText("Active")).toBeVisible();
  await expect(objectives.getByText(/Determine whether the ferry departure record is authentic/i)).toBeVisible();

  // Launcher now lists the unlocked Signal Analyzer
  await page.getByRole("button", { name: "Launcher" }).click();
  await expect(page.getByRole("menuitem", { name: "Signal Analyzer" })).toBeVisible();

  // Open the Signal Analyzer; the authored puzzle renders with all properties
  await page.getByRole("menuitem", { name: "Signal Analyzer" }).click();
  const analyzer = page.locator('[aria-label="Signal Analyzer"]');
  await expect(analyzer).toBeVisible();
  await expect(analyzer.getByText(/Ferry event signature comparison/i)).toBeVisible();
  await expect(analyzer.getByText("Gate device")).toBeVisible();
  await expect(analyzer.getByText("Physical terminal")).toBeVisible();
  await expect(analyzer.getByText("Replication service")).toBeVisible();
  await expect(analyzer.getByText("Location proof")).toBeVisible();
  await expect(analyzer.getByText("Beacon and camera")).toBeVisible();
  await expect(analyzer.getByText("Beacon only")).toBeVisible();
  await expect(analyzer.getByText("Account signature")).toBeVisible();
  await expect(analyzer.getByText("Passenger token")).toBeVisible();
  await expect(analyzer.getByText("Administrative replay token")).toBeVisible();
  await expect(analyzer.getByText("Sync delay")).toBeVisible();
  await expect(analyzer.getByText("2–8 seconds")).toBeVisible();
  await expect(analyzer.getByText("19 minutes")).toBeVisible();

  // Incorrect attempt: marking only a non-decisive property is rejected
  await analyzer.getByRole("checkbox", { name: "Mark Location proof as a discrepancy" }).click();
  await analyzer.getByRole("button", { name: "Analyze" }).click();
  await expect(analyzer.getByRole("status").getByText(/do not match the event signature/i)).toBeVisible();

  // The Stage 2 objective is still active after the failed attempt
  const stage2Objective = objectives.locator("article", {
    hasText: /Determine whether the ferry departure record is authentic/i,
  });
  await expect(stage2Objective.getByText("Active")).toBeVisible();

  // Correct attempt: exactly the decisive set {Gate device, Account signature}
  await analyzer.getByRole("checkbox", { name: "Mark Location proof as a discrepancy" }).click();
  await analyzer.getByRole("checkbox", { name: "Mark Gate device as a discrepancy" }).click();
  await analyzer.getByRole("checkbox", { name: "Mark Account signature as a discrepancy" }).click();
  await analyzer.getByRole("button", { name: "Analyze" }).click();
  await expect(analyzer.getByRole("status").getByText(/administrative replay service/i)).toBeVisible();

  // Stage 2 objective completes; no active objectives remain in this case
  await expect(stage2Objective.getByText("Completed")).toBeVisible();
  await expect(objectives.getByText("Active")).toHaveCount(0);

  // Solution evidence appears on the board alongside the Stage 1 discoveries
  await page.getByRole("button", { name: "Launcher" }).click();
  await page.getByRole("menuitem", { name: "Evidence Board" }).click();
  const board = page.locator('[aria-label="Evidence Board"]');
  await expect(board).toBeVisible();
  await expect(board.getByRole("button", { name: /Evidence: Administrative Replay Signature/i })).toBeVisible();
  await expect(board.getByRole("button", { name: /Evidence: Ferry Departure Record/i })).toBeVisible();
  await expect(board.getByRole("button", { name: /Evidence: North Barrier Emergency Call Metadata/i })).toBeVisible();

  // Canonical board edit; wait for persistence
  await board.getByLabel("New private note").fill("Replay injection confirmed.");
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
  if (await page.locator('[aria-label="Signal Analyzer"]').count() === 0) {
    await page.getByRole("button", { name: "Launcher" }).click();
    await page.getByRole("menuitem", { name: "Signal Analyzer" }).click();
  }

  // Restored state: both objectives completed, analyzer still unlocked,
  // solution evidence and note intact
  const restoredObjectives = page.locator('[aria-label="Objectives"]');
  await expect(restoredObjectives.locator("article", { hasText: /Determine whether the ferry departure record is authentic/i }).getByText("Completed")).toBeVisible();
  await expect(restoredObjectives.locator("article", { hasText: /Verify Maya Pranata's final confirmed location/i }).getByText("Completed")).toBeVisible();
  await expect(restoredObjectives.getByText("Active")).toHaveCount(0);
  const restoredAnalyzer = page.locator('[aria-label="Signal Analyzer"]');
  await expect(restoredAnalyzer.getByText(/Ferry event signature comparison/i)).toBeVisible();
  const restoredBoard = page.locator('[aria-label="Evidence Board"]');
  await expect(restoredBoard.getByRole("button", { name: /Evidence: Administrative Replay Signature/i })).toBeVisible();
  await expect(restoredBoard.getByRole("button", { name: /Note: Replay injection confirmed./i })).toBeVisible();

  expect(pageErrors).toEqual([]);
  expect(consoleErrors).toEqual([]);
});
