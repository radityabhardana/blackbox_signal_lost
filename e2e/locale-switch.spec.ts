import { expect, test } from "@playwright/test";
import { completeStage0 } from "./helpers/seed-legacy-save";

// Locale switch E2E: the Settings app's language switcher localizes chrome
// (launcher, taskbar, window titles) and case content (objective titles from
// the id overlay) live, persists across reload via `bbx.locale`, and switches
// back to English live.
//
// Window navigation follows the same rules as the other /game specs:
// - every launcher menuitem click creates a NEW window, so each app is opened
//   via the launcher exactly once;
// - after reload, restored windows may be buried or absent, so they are
//   defensively reopened via the launcher and raised through their taskbar
//   item (`aria-label` from `ui.taskbar.windowState`).
test("locale switch localizes chrome and case content live, persists across reload, and switches back", async ({
  page,
}) => {
  // Zero-error guard: any page or console error fails the test.
  const pageErrors: string[] = [];
  page.on("pageerror", (error) => {
    pageErrors.push(error.message);
  });
  const consoleErrors: string[] = [];
  page.on("console", (message) => {
    if (message.type() === "error") {
      consoleErrors.push(message.text());
    }
  });

  const html = page.locator("html");

  // ---- Landing renders in English by default ----
  await page.goto("/");
  await expect(html).toHaveAttribute("lang", "en");
  await expect(html).toHaveAttribute("data-locale", "en");
  await expect(
    page.getByRole("heading", { level: 1, name: /blackbox: signal lost/i }),
  ).toBeVisible();
  await expect(page.getByRole("link", { name: /start investigation/i })).toBeVisible();

  // ---- Navigate to /game ----
  await page.getByRole("link", { name: /start investigation/i }).click();
  await expect(page).toHaveURL(/\/game$/);
  await expect(page.locator('[data-hydration-status="ready"]')).toBeVisible();
  await expect(page.getByText(/missing signal/i)).toBeVisible();

  await completeStage0(page);

  // ---- Objectives: canonical English case content ----
  await page.getByRole("button", { name: "Launcher" }).click();
  await page.getByRole("menuitem", { name: "Objectives" }).click();
  const objectivesEn = page.locator('[aria-label="Objectives"]');
  await expect(objectivesEn).toBeVisible();
  await expect(
    objectivesEn.getByText(/Verify Maya Pranata's final confirmed location/i),
  ).toBeVisible();

  // ---- Settings: switch to Bahasa Indonesia ----
  await page.getByRole("button", { name: "Launcher" }).click();
  await page.getByRole("menuitem", { name: "Settings" }).click();
  const settings = page.locator('[aria-label="Settings"]');
  await expect(settings).toBeVisible();
  await settings.getByLabel("Bahasa Indonesia").click();

  // Live localization WITHOUT reload: document element flips and persists...
  await expect(html).toHaveAttribute("lang", "id");
  await expect(html).toHaveAttribute("data-locale", "id");
  expect(await page.evaluate(() => window.localStorage.getItem("bbx.locale"))).toBe("id");

  // ...chrome flips (launcher button + Settings taskbar item aria-label)...
  await expect(page.getByRole("button", { name: "Peluncur" })).toBeVisible();
  await expect(page.getByRole("button", { name: /Jendela Pengaturan/ })).toBeVisible();

  // ...and case content flips (case title + objective title from the id overlay).
  await expect(page.getByText(/sinyal hilang/i)).toBeVisible();
  await expect(page.getByText(/missing signal/i)).toHaveCount(0);
  const objectivesId = page.locator('[aria-label="Objektif"]');
  await expect(objectivesId).toBeVisible();
  await expect(
    objectivesId.getByText(/Verifikasi lokasi terakhir Maya Pranata/),
  ).toBeVisible();
  await expect(
    objectivesId.getByText(/Verify Maya Pranata's final confirmed location/i),
  ).toHaveCount(0);

  // ---- Reload: locale persists ----
  await page.reload();
  await expect(page.locator('[data-hydration-status="ready"]')).toBeVisible();
  await expect(html).toHaveAttribute("lang", "id");
  await expect(page.getByText(/sinyal hilang/i)).toBeVisible();
  await expect(page.getByText(/missing signal/i)).toHaveCount(0);

  // Defensive reopen, then raise the Objectives window via its taskbar item.
  if ((await page.locator('[aria-label="Objektif"]').count()) === 0) {
    await page.getByRole("button", { name: "Peluncur" }).click();
    await page.getByRole("menuitem", { name: "Objektif" }).click();
  }
  await page.getByRole("button", { name: /Jendela Objektif/ }).click();
  const restoredObjectives = page.locator('[aria-label="Objektif"]');
  await expect(
    restoredObjectives.getByText(/Verifikasi lokasi terakhir Maya Pranata/),
  ).toBeVisible();

  // ---- Switch back to English: live, no reload ----
  if ((await page.locator('[aria-label="Pengaturan"]').count()) === 0) {
    await page.getByRole("button", { name: "Peluncur" }).click();
    await page.getByRole("menuitem", { name: "Pengaturan" }).click();
  }
  await page.getByRole("button", { name: /Jendela Pengaturan/ }).click();
  await page
    .locator('[aria-label="Pengaturan"]')
    .getByLabel("English", { exact: true })
    .click();

  await expect(html).toHaveAttribute("lang", "en");
  await expect(html).toHaveAttribute("data-locale", "en");
  await expect(page.getByRole("button", { name: "Launcher" })).toBeVisible();
  await expect(page.getByRole("button", { name: /Settings window/ })).toBeVisible();
  await expect(page.getByText(/missing signal/i)).toBeVisible();
  const objectivesBack = page.locator('[aria-label="Objectives"]');
  await expect(objectivesBack).toBeVisible();
  await expect(
    objectivesBack.getByText(/Verify Maya Pranata's final confirmed location/i),
  ).toBeVisible();

  expect(pageErrors).toEqual([]);
  expect(consoleErrors).toEqual([]);
});
