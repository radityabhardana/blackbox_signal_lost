import { expect, test } from "@playwright/test";

// Production endgame E2E for Case 001: Stage 5 + Stage 6 Conclusion Report.
// Exercises the full fresh-start-to-ending path (Protected Truth), then
// reload-verification, then retry.  Reuses the midgame spec's proven Stage 1–4
// steps (Option 2 branch) to reach the endgame efficiently.
//
// Window navigation follows the same rules as the midgame spec:
// - `openWindow` does not dedupe: every launcher menuitem click creates a NEW
//   window. Each app is therefore opened via the launcher exactly once, then
//   buried windows are brought back to front through their taskbar item
//   (`aria-label="{title} window, {state}"`), which calls `raiseToTop`.
test("production /game: Stage 1 -> Stage 2 -> Stage 3 -> Stage 4 -> Stage 5 -> Protected Truth ending survives reload and retry", async ({
  page,
}) => {
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
  await page.getByRole("button", { name: "Launcher" }).click();
  await page.getByRole("menuitem", { name: "Messenger" }).click();
  const messenger = page.getByRole("region", { name: "Messenger" });
  await expect(messenger).toBeVisible();
  await expect(messenger.getByText(/damaged service tablet/i)).toBeVisible();
  await messenger.getByRole("button", { name: "Let Sera inspect it offline first" }).click();
  await expect(messenger.getByText(/keeps the diagnostics intact/i)).toBeVisible();

  // ---- Stage 4: Records — Node 7, escalation, corridor ----
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

  // ---- Stage 5 (optional): Messenger — masked contact, ask for proof ----
  // The masked contact surfaces after Stage 4 completion.
  await page.getByRole("button", { name: /Messenger window,/i }).click();
  await expect(messenger.getByText(/wants the case closed/i)).toBeVisible();
  const askProof = messenger.getByRole("button", { name: "Ask for proof" });
  await expect(askProof).toBeEnabled();
  await askProof.click();
  await expect(messenger.getByText(/checksum record has been made available/i)).toBeVisible();

  // ---- Stage 6: Conclusion Report — unlocked after Stage 4 ----
  await page.getByRole("button", { name: "Launcher" }).click();
  await expect(page.getByRole("menuitem", { name: "Conclusion Report" })).toBeVisible();
  await page.getByRole("menuitem", { name: "Conclusion Report" }).click();
  const conclusion = page.locator('[aria-label="Conclusion Report"]');
  await expect(conclusion).toBeVisible();

  // Fill the report — Protected Truth path (all correct + MIO redact).
  await conclusion.getByLabel("North Barrier maintenance corridor").click();
  await conclusion.getByLabel("Falsified through administrative replay").click();
  await conclusion.getByLabel("Reno Adikara").click();
  await conclusion.getByLabel("To preserve or retrieve Node 7 diagnostic evidence").click();

  // Evidence slots: select 3 discovered evidence items by value (evidence ID).
  await conclusion.getByLabel("Evidence slot 1").selectOption("ev_001_emergency_call");
  await conclusion.getByLabel("Evidence slot 2").selectOption("ev_001_replay_signature");
  await conclusion.getByLabel("Evidence slot 3").selectOption("ev_001_corridor_access");

  // Disclosure: MIO with Maya's location redacted.
  await conclusion
    .getByLabel("Submit obstruction evidence with Maya's location redacted")
    .click();

  // Review → Submit.
  await conclusion.getByRole("button", { name: "Review Report" }).click();
  await conclusion.getByRole("button", { name: "Submit Report" }).click();

  // Outcome: "Case Concluded" + "Protected Truth" heading + body text.
  await expect(conclusion.getByRole("heading", { name: "Case Concluded" })).toBeVisible();
  await expect(conclusion.getByRole("heading", { name: "Protected Truth" })).toBeVisible();
  await expect(conclusion.getByText(/MIO opens a limited review/i)).toBeVisible();

  // Wait for persistence.
  await expect(page.locator('[data-persistence-status="saved"]')).toBeVisible();

  // ---- Reload and re-hydrate ----
  await page.reload();
  await expect(page.locator('[data-hydration-status="ready"]')).toBeVisible();
  await expect(page.getByText(/case: missing signal/i)).toBeVisible();

  // Defensive reopen: Conclusion Report window.
  if (await page.locator('[aria-label="Conclusion Report"]').count() === 0) {
    await page.getByRole("button", { name: "Launcher" }).click();
    await page.getByRole("menuitem", { name: "Conclusion Report" }).click();
  }

  // Outcome STILL renders "Protected Truth" — no re-form, no re-roll.
  const restoredConclusion = page.locator('[aria-label="Conclusion Report"]');
  await expect(restoredConclusion.getByRole("heading", { name: "Case Concluded" })).toBeVisible();
  await expect(restoredConclusion.getByRole("heading", { name: "Protected Truth" })).toBeVisible();
  // No claim radios visible (the form is gone).
  await expect(restoredConclusion.getByLabel("North Barrier maintenance corridor")).toHaveCount(0);

  // ---- Retry Investigation: remounts from checkpoint, returns to form ----
  // The "Retry Investigation" button is in the outcome footer.
  await restoredConclusion.getByRole("button", { name: "Retry Investigation" }).click();

  // Defensive reopen: the checkpoint restore may close the window; reopen if needed.
  if (await page.locator('[aria-label="Conclusion Report"]').count() === 0) {
    await page.getByRole("button", { name: "Launcher" }).click();
    await page.getByRole("menuitem", { name: "Conclusion Report" }).click();
  }

  // The form renders again with claim radios present (fresh draft).
  const retryConclusion = page.locator('[aria-label="Conclusion Report"]');
  await expect(retryConclusion.getByLabel("North Barrier maintenance corridor")).toBeVisible();
  await expect(retryConclusion.getByLabel("Falsified through administrative replay")).toBeVisible();
  await expect(retryConclusion.getByLabel("Reno Adikara")).toBeVisible();
  await expect(retryConclusion.getByLabel("To preserve or retrieve Node 7 diagnostic evidence")).toBeVisible();

  expect(pageErrors).toEqual([]);
  expect(consoleErrors).toEqual([]);
});