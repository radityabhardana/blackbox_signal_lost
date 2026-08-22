import { expect, test } from "@playwright/test";

// First-run id-locale smoke: Stage 0 completes cleanly under the Indonesian
// locale, and the id overlay localizes the Mail onboarding while preserving the
// canonical English case ids (overlays never rewrite ids).
test("first run id: Stage 0 onboarding is localized and completes in Bahasa Indonesia", async ({ page }) => {
  const pageErrors: string[] = [];
  page.on("pageerror", (error) => pageErrors.push(error.message));
  const consoleErrors: string[] = [];
  page.on("console", (message) => { if (message.type() === "error") consoleErrors.push(message.text()); });

  const html = page.locator("html");
  await page.goto("/game");
  await expect(page.locator('[data-hydration-status="ready"]')).toBeVisible();

  // Skip the boot overlay, then switch the UI language to Indonesian.
  await page.getByRole("button", { name: "Skip to main content" }).click();
  await page.getByRole("button", { name: "Launcher" }).click();
  await page.getByRole("menuitem", { name: "Settings" }).click();
  await page.locator('[aria-label="Settings"]').getByLabel("Bahasa Indonesia").click();
  await expect(html).toHaveAttribute("lang", "id");

  // The case title overlay renders "Sinyal Hilang" (BBX-134).
  await expect(page.getByText(/sinyal hilang/i)).toBeVisible();

  // Stage 0 under id locale: the onboarding briefing is localized.
  await page.getByRole("button", { name: "Peluncur" }).click();
  await page.getByRole("menuitem", { name: "Surel" }).click();
  await page
    .getByRole("button", { name: /Selamat datang di BLACKBOX/i })
    .first()
    .click();
  await page.getByRole("button", { name: /Lampiran Dokumen 1/i }).click();
  await page.getByRole("button", { name: /Konfirmasi identitas analis/i }).click();
  await page.getByRole("button", { name: "Konfirmasi analis" }).click();

  // Stage 0 → Stage 1 handoff is engine-driven and locale-independent.
  await page.getByRole("button", { name: "Peluncur" }).click();
  await page.getByRole("menuitem", { name: "Objektif" }).click();
  const objectives = page.locator('[aria-label="Objektif"]');
  await expect(objectives).toBeVisible();
  await expect(objectives.getByText(/Verifikasi lokasi terakhir Maya Pranata/)).toBeVisible();

  expect(pageErrors).toEqual([]);
  expect(consoleErrors).toEqual([]);
});
