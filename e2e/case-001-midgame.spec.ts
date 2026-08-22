import { expect, test } from "@playwright/test";
import { completeStage0 } from "./helpers/seed-legacy-save";

// Production midgame E2E for the Case 001 Stage 3 + Stage 4 + BBX-061 delivery.
// Exercises ONE branch end-to-end (Option 2 — "Let Sera inspect it offline
// first"), which additionally fires the flag-gated trigger_003_diagnostic_note
// (Maya's Diagnostic Note evidence). The other two branches are proven by the
// parameterized domain tests in case-001-content.test.ts.
//
// Window navigation notes:
// - `openWindow` does not dedupe: every launcher menuitem click creates a NEW
//   window. Each app is therefore opened via the launcher exactly once, then
//   buried windows are brought back to front through their taskbar item
//   (`aria-label="{title} window, {state}"`), which calls `raiseToTop`.
test("production /game: Stage 2 -> Stage 3 -> Stage 4 midgame loop survives reload", async ({ page }) => {
  const pageErrors: string[] = [];
  page.on("pageerror", (error) => pageErrors.push(error.message));
  const consoleErrors: string[] = [];
  page.on("console", (message) => {
    if (message.type() === "error") {
      consoleErrors.push(message.text());
    }
  });

  await page.goto("/game");
  await expect(page.locator('[data-hydration-status="ready"]')).toBeVisible();
  await expect(page.getByText(/case: missing signal/i)).toBeVisible();

  await completeStage0(page);

  // ---- Stage 1: Records — ferry departure + emergency call ----
  await page.getByRole("button", { name: "Launcher" }).click();
  await page.getByRole("menuitem", { name: "Records" }).click();
  const searchbox = page.getByRole("searchbox", { name: /search records/i });
  await expect(searchbox).toBeVisible();
  await searchbox.fill("ferry");
  await searchbox.press("Enter");
  await page.getByRole("button", { name: /ferry departure record/i }).click();
  await page.getByRole("button", { name: "Back" }).click();
  await searchbox.fill("emergency");
  await searchbox.press("Enter");
  await page.getByRole("button", { name: /north barrier emergency call/i }).click();
  await page.getByRole("button", { name: "Back" }).click();

  // ---- Stage 2: Signal Analyzer — decisive discrepancies ----
  await page.getByRole("button", { name: "Launcher" }).click();
  await page.getByRole("menuitem", { name: "Signal Analyzer" }).click();
  const analyzer = page.locator('[aria-label="Signal Analyzer"]');
  await expect(analyzer).toBeVisible();
  await analyzer.getByRole("checkbox", { name: "Mark Gate device as a discrepancy" }).click();
  await analyzer.getByRole("checkbox", { name: "Mark Account signature as a discrepancy" }).click();
  await analyzer.getByRole("button", { name: "Analyze" }).click();
  await expect(analyzer.getByRole("status").getByText(/administrative replay service/i)).toBeVisible();

  // ---- Stage 3: Messenger — Sera's tablet decision (Option 2) ----
  // The populated messenger renders no inner aria-label region; the window
  // frame is a section labelled by its title, i.e. a region named "Messenger".
  await page.getByRole("button", { name: "Launcher" }).click();
  await page.getByRole("menuitem", { name: "Messenger" }).click();
  const messenger = page.getByRole("region", { name: "Messenger" });
  await expect(messenger).toBeVisible();
  await expect(messenger.getByText(/damaged service tablet/i)).toBeVisible();
  const ciabChoice = messenger.getByRole("button", { name: "Send it directly to CIAB" });
  const offlineChoice = messenger.getByRole("button", { name: "Let Sera inspect it offline first" });
  const pelagaChoice = messenger.getByRole("button", { name: "Hand it to Pelaga security" });
  await expect(ciabChoice).toBeEnabled();
  await expect(offlineChoice).toBeEnabled();
  await expect(pelagaChoice).toBeEnabled();

  await offlineChoice.click();
  await expect(messenger.getByText(/keeps the diagnostics intact/i)).toBeVisible();
  await expect(ciabChoice).toBeDisabled();
  await expect(pelagaChoice).toBeDisabled();

  // ---- Stage 4 activates (trigger_003_stage4_activation) ----
  await page.getByRole("button", { name: "Launcher" }).click();
  await page.getByRole("menuitem", { name: "Objectives" }).click();
  const objectives = page.locator('[aria-label="Objectives"]');
  await expect(objectives).toBeVisible();
  const obj003 = objectives.locator("article", {
    hasText: /Identify why Maya entered North Barrier after curfew/i,
  });
  await expect(obj003.getByText("Active")).toBeVisible();

  // ---- Option-2 consequence: Maya's Diagnostic Note (trigger_003_diagnostic_note) ----
  await page.getByRole("button", { name: "Launcher" }).click();
  await page.getByRole("menuitem", { name: "Evidence Board" }).click();
  const board = page.locator('[aria-label="Evidence Board"]');
  await expect(board).toBeVisible();
  await expect(board.getByRole("button", { name: /Evidence: Maya's Diagnostic Note/i })).toBeVisible();

  // ---- Hint requests BEFORE Stage 4 completion (only offered on ACTIVE objectives) ----
  // The Objectives window is buried under Evidence Board; refocus it through
  // its taskbar item instead of reopening (launcher would duplicate the window).
  await page.getByRole("button", { name: /Objectives window,/i }).click();
  await obj003.getByRole("button", { name: "Hint (Refocus)" }).click();
  await expect(obj003.getByText(/\[Refocus\] Maya did not leave Nusakara/i)).toBeVisible();
  const directionButton = obj003.getByRole("button", { name: "Hint (Direction)" });
  await expect(directionButton).toBeVisible();
  await directionButton.click();
  await expect(obj003.getByText(/\[Direction\] Investigate the Node 7 maintenance summary/i)).toBeVisible();
  await expect(obj003.getByRole("button", { name: "Hint (Connection)" })).toBeVisible();

  // ---- Stage 4 investigation: Records (record_opened -> discover_evidence) ----
  await page.getByRole("button", { name: /Records window,/i }).click();
  await searchbox.fill("node 7");
  await searchbox.press("Enter");
  await page.getByRole("button", { name: /Node 7 Maintenance Summary/i }).click();
  await page.getByRole("button", { name: "Back" }).click();
  await searchbox.fill("escalation");
  await searchbox.press("Enter");
  await page.getByRole("button", { name: /Manual Escalation — Node 7 Alert Suppression/i }).click();
  await page.getByRole("button", { name: "Back" }).click();
  await searchbox.fill("corridor");
  await searchbox.press("Enter");
  await page.getByRole("button", { name: /North Barrier Corridor Access Log/i }).click();
  await page.getByRole("button", { name: "Back" }).click();

  // ---- Objectives: obj_003 Completed (trigger_004_obj003_complete) ----
  await expect(obj003.getByText("Completed")).toBeVisible();

  // ---- Completed-objective hint state: no "Hint (" button, history retained ----
  await expect(obj003.getByRole("button", { name: /^Hint \(/ })).toHaveCount(0);
  await expect(obj003.getByText(/\[Refocus\] Maya did not leave Nusakara/i)).toBeVisible();
  await expect(obj003.getByText(/\[Direction\] Investigate the Node 7 maintenance summary/i)).toBeVisible();

  // ---- Evidence Board: all four evidence nodes (incl. optional isolation event) ----
  await expect(board.getByRole("button", { name: /Evidence: Node 7 Maintenance Summary/i })).toBeVisible();
  await expect(board.getByRole("button", { name: /Evidence: Maya's Escalation Ticket/i })).toBeVisible();
  await expect(board.getByRole("button", { name: /Evidence: North Barrier Corridor Access Log/i })).toBeVisible();
  await expect(board.getByRole("button", { name: /Evidence: System Isolation Event/i })).toBeVisible();

  // ---- Canonical persistence edit on the board ----
  await page.getByRole("button", { name: /Evidence Board window,/i }).click();
  await board.getByLabel("New private note").fill("Node 7 suppression confirmed.");
  await board.getByRole("button", { name: "Add private note" }).click();
  await expect(page.locator('[data-persistence-status="saved"]')).toBeVisible();

  // ---- Reload and re-hydrate ----
  await page.reload();
  await expect(page.locator('[data-hydration-status="ready"]')).toBeVisible();
  await expect(page.getByText(/case: missing signal/i)).toBeVisible();

  // ---- Defensive window reopen (layout may restore some windows already) ----
  if (await page.locator('[aria-label="Evidence Board"]').count() === 0) {
    await page.getByRole("button", { name: "Launcher" }).click();
    await page.getByRole("menuitem", { name: "Evidence Board" }).click();
  }
  if (await page.locator('[aria-label="Objectives"]').count() === 0) {
    await page.getByRole("button", { name: "Launcher" }).click();
    await page.getByRole("menuitem", { name: "Objectives" }).click();
  }
  if (await page.getByRole("region", { name: "Messenger" }).count() === 0) {
    await page.getByRole("button", { name: "Launcher" }).click();
    await page.getByRole("menuitem", { name: "Messenger" }).click();
  }
  if (await page.locator('[aria-label="Signal Analyzer"]').count() === 0) {
    await page.getByRole("button", { name: "Launcher" }).click();
    await page.getByRole("menuitem", { name: "Signal Analyzer" }).click();
  }

  // ---- Restored state ----
  const restoredObjectives = page.locator('[aria-label="Objectives"]');
  const restoredObj001 = restoredObjectives.locator("article", {
    hasText: /Verify Maya Pranata's final confirmed location/i,
  });
  const restoredObj002 = restoredObjectives.locator("article", {
    hasText: /Determine whether the ferry departure record is authentic/i,
  });
  const restoredObj003 = restoredObjectives.locator("article", {
    hasText: /Identify why Maya entered North Barrier after curfew/i,
  });
  await expect(restoredObj001.getByText("Completed")).toBeVisible();
  await expect(restoredObj002.getByText("Completed")).toBeVisible();
  await expect(restoredObj003.getByText("Completed")).toBeVisible();
  await expect(restoredObj003.getByRole("button", { name: /^Hint \(/ })).toHaveCount(0);
  await expect(restoredObj003.getByText(/\[Refocus\] Maya did not leave Nusakara/i)).toBeVisible();
  await expect(restoredObj003.getByText(/\[Direction\] Investigate the Node 7 maintenance summary/i)).toBeVisible();

  const restoredBoard = page.locator('[aria-label="Evidence Board"]');
  await expect(restoredBoard.getByRole("button", { name: /Evidence: Maya's Diagnostic Note/i })).toBeVisible();
  await expect(restoredBoard.getByRole("button", { name: /Evidence: Node 7 Maintenance Summary/i })).toBeVisible();
  await expect(restoredBoard.getByRole("button", { name: /Evidence: Maya's Escalation Ticket/i })).toBeVisible();
  await expect(restoredBoard.getByRole("button", { name: /Evidence: North Barrier Corridor Access Log/i })).toBeVisible();
  await expect(restoredBoard.getByRole("button", { name: /Evidence: System Isolation Event/i })).toBeVisible();
  await expect(restoredBoard.getByRole("button", { name: /Note: Node 7 suppression confirmed./i })).toBeVisible();

  const restoredMessenger = page.getByRole("region", { name: "Messenger" });
  await expect(restoredMessenger.getByText(/damaged service tablet/i)).toBeVisible();
  await expect(restoredMessenger.getByText(/keeps the diagnostics intact/i)).toBeVisible();
  await expect(
    restoredMessenger.getByRole("button", { name: "Send it directly to CIAB" }),
  ).toBeDisabled();
  await expect(
    restoredMessenger.getByRole("button", { name: "Hand it to Pelaga security" }),
  ).toBeDisabled();

  const restoredAnalyzer = page.locator('[aria-label="Signal Analyzer"]');
  await expect(restoredAnalyzer.getByText(/Ferry event signature comparison/i)).toBeVisible();

  expect(pageErrors).toEqual([]);
  expect(consoleErrors).toEqual([]);
});
