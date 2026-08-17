import { expect, test, type Locator, type Page } from "@playwright/test";

// Outcome-variant E2E for the Case 001 Conclusion Report, driven through the
// guarded /test/endgame harness (post-Stage-4 state: obj_003 completed,
// app_conclusion unlocked, masked contact queued). The harness only bootstraps
// the session; outcome evaluation is production code (report-submission +
// evaluate-outcomes). Three fast tests cover endings D, B, and C — the
// Protected Truth (A) path is covered by the full production spec.

const EVIDENCE_SLOT_IDS = [
  "ev_001_emergency_call",
  "ev_001_replay_signature",
  "ev_001_corridor_access",
] as const;

const CORRECT_CLAIMS = {
  location: "North Barrier maintenance corridor",
  ferryRecord: "Falsified through administrative replay",
  obstruction: "Reno Adikara",
  returnReason: "To preserve or retrieve Node 7 diagnostic evidence",
} as const;

async function openConclusionReport(page: Page): Promise<Locator> {
  await page.getByRole("button", { name: "Launcher" }).click();
  await page.getByRole("menuitem", { name: "Conclusion Report" }).click();
  const conclusion = page.locator('[aria-label="Conclusion Report"]');
  await expect(conclusion).toBeVisible();
  return conclusion;
}

interface ReportOptions {
  readonly location: string;
  readonly ferryRecord: string;
  readonly obstruction: string;
  readonly returnReason: string;
  readonly disclosure: string;
}

async function fillAndSubmitReport(conclusion: Locator, options: ReportOptions): Promise<void> {
  await conclusion.getByLabel(options.location).click();
  await conclusion.getByLabel(options.ferryRecord).click();
  await conclusion.getByLabel(options.obstruction).click();
  await conclusion.getByLabel(options.returnReason).click();
  await conclusion.getByLabel("Evidence slot 1").selectOption(EVIDENCE_SLOT_IDS[0]);
  await conclusion.getByLabel("Evidence slot 2").selectOption(EVIDENCE_SLOT_IDS[1]);
  await conclusion.getByLabel("Evidence slot 3").selectOption(EVIDENCE_SLOT_IDS[2]);
  await conclusion.getByLabel(options.disclosure).click();
  await conclusion.getByRole("button", { name: "Review Report" }).click();
  await conclusion.getByRole("button", { name: "Submit Report" }).click();
}

function attachErrorCollectors(page: Page): { pageErrors: string[]; consoleErrors: string[] } {
  const pageErrors: string[] = [];
  page.on("pageerror", (error) => pageErrors.push(error.message));
  const consoleErrors: string[] = [];
  page.on("console", (message) => {
    if (message.type() === "error") {
      consoleErrors.push(message.text());
    }
  });
  return { pageErrors, consoleErrors };
}

test("endgame harness: wrong claim yields the Misidentified Culprit ending", async ({ page }) => {
  const { pageErrors, consoleErrors } = attachErrorCollectors(page);

  await page.goto("/test/endgame");
  await expect(page.locator('[data-hydration-status="ready"]')).toBeVisible();

  const conclusion = await openConclusionReport(page);
  await fillAndSubmitReport(conclusion, {
    // Wrong Claim A: ferry to the mainland instead of North Barrier corridor.
    location: "Ferry to the mainland",
    ferryRecord: CORRECT_CLAIMS.ferryRecord,
    obstruction: CORRECT_CLAIMS.obstruction,
    returnReason: CORRECT_CLAIMS.returnReason,
    disclosure: "Submit the full diagnostic archive to MIO",
  });

  await expect(conclusion.getByRole("heading", { name: "Case Concluded" })).toBeVisible();
  await expect(conclusion.getByRole("heading", { name: "Misidentified Culprit" })).toBeVisible();

  expect(pageErrors).toEqual([]);
  expect(consoleErrors).toEqual([]);
});

test("endgame harness: forwarding the masked contact yields Official Compliance", async ({ page }) => {
  const { pageErrors, consoleErrors } = attachErrorCollectors(page);

  await page.goto("/test/endgame");
  await expect(page.locator('[data-hydration-status="ready"]')).toBeVisible();

  // Stage 5: forward the masked contact to CIAB (sets masked_forwarded).
  await page.getByRole("button", { name: "Launcher" }).click();
  await page.getByRole("menuitem", { name: "Messenger" }).click();
  const messenger = page.getByRole("region", { name: "Messenger" });
  await expect(messenger).toBeVisible();
  await expect(messenger.getByText(/wants the case closed/i)).toBeVisible();
  const forward = messenger.getByRole("button", { name: "Forward the message to CIAB" });
  await forward.click();
  // The authored consequence only sets masked_forwarded — no reply is queued.
  // The choice itself registering is confirmed by the button disabling.
  await expect(forward).toBeDisabled();

  // Correct claims + Pelaga disclosure: masked_forwarded OR pelaga both match B;
  // A is excluded because the disclosure recipient is not MIO.
  const conclusion = await openConclusionReport(page);
  await fillAndSubmitReport(conclusion, {
    location: CORRECT_CLAIMS.location,
    ferryRecord: CORRECT_CLAIMS.ferryRecord,
    obstruction: CORRECT_CLAIMS.obstruction,
    returnReason: CORRECT_CLAIMS.returnReason,
    disclosure: "Follow Pelaga's request and classify the archive as stolen data",
  });

  await expect(conclusion.getByRole("heading", { name: "Case Concluded" })).toBeVisible();
  await expect(conclusion.getByRole("heading", { name: "Official Compliance" })).toBeVisible();

  expect(pageErrors).toEqual([]);
  expect(consoleErrors).toEqual([]);
});

test("endgame harness: leak yields the Public Exposure ending", async ({ page }) => {
  const { pageErrors, consoleErrors } = attachErrorCollectors(page);

  await page.goto("/test/endgame");
  await expect(page.locator('[data-hydration-status="ready"]')).toBeVisible();

  const conclusion = await openConclusionReport(page);
  await fillAndSubmitReport(conclusion, {
    location: CORRECT_CLAIMS.location,
    ferryRecord: CORRECT_CLAIMS.ferryRecord,
    obstruction: CORRECT_CLAIMS.obstruction,
    returnReason: CORRECT_CLAIMS.returnReason,
    disclosure: "Leak the archive to Open Signal",
  });

  await expect(conclusion.getByRole("heading", { name: "Case Concluded" })).toBeVisible();
  await expect(conclusion.getByRole("heading", { name: "Public Exposure" })).toBeVisible();

  expect(pageErrors).toEqual([]);
  expect(consoleErrors).toEqual([]);
});