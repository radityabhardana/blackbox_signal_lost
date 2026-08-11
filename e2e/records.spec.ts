import { expect, test } from "@playwright/test";

test("records: search-first, record_opened gating, classified privacy, back navigation", async ({ page }) => {
  const pageErrors: string[] = [];
  const consoleErrors: string[] = [];
  page.on("pageerror", (error) => pageErrors.push(error.message));
  page.on("console", (message) => {
    if (message.type() === "error") consoleErrors.push(message.text());
  });

  await page.goto("/test/records");

  // Harness guarded: only reachable with PLAYWRIGHT_TEST=1.
  await page.getByRole("button", { name: "Launcher" }).click();
  await page.getByRole("menuitem", { name: /^records$/i }).click();

  const searchbox = page.getByRole("searchbox", { name: /search records/i });
  await expect(searchbox).toBeVisible();

  // Search-first: nothing is listed before a query is submitted.
  await expect(page.getByText(/search the archive to find records/i)).toBeVisible();
  await expect(page.getByRole("button", { name: /test record/i })).toHaveCount(0);

  // A record gated on record_opened is not searchable before any open.
  await searchbox.fill("ferry");
  await searchbox.press("Enter");
  await expect(page.getByText(/no records match your search/i)).toBeVisible();

  // Open an available record: detail shows headline fields only, no evidence
  // before discovery, and record_opened unlocks the ferry log for search.
  await searchbox.fill("test");
  await searchbox.press("Enter");
  await page.getByRole("button", { name: /test record/i }).click();

  const detail = page.getByRole("region", { name: "Record", exact: true });
  await expect(detail).toContainText("Test record");
  await expect(detail).toContainText("test");
  await expect(detail).not.toContainText("Test evidence");

  // Back closes the detail and restores focus to the search input.
  await page.getByRole("button", { name: "Back" }).click();
  await expect(page.getByText(/select a record to read/i)).toBeVisible();
  await expect(searchbox).toBeFocused();

  // record_opened was recorded: the ferry log is searchable now.
  await searchbox.fill("ferry");
  await searchbox.press("Enter");
  await page.getByRole("button", { name: /ferry transfer log/i }).click();
  await expect(detail).toContainText("Ferry transfer log");
  await expect(detail).toContainText("org_ferry_services");
  await expect(page.getByRole("button", { name: "Back" })).toBeVisible();

  // Classified placeholder: generic, sanitized, and inert.
  await page.getByRole("button", { name: "Back" }).click();
  await searchbox.fill("reactor");
  await searchbox.press("Enter");
  await expect(page.getByText("Unavailable record")).toBeVisible();
  await expect(page.getByText(/reactor core inspection/i)).toHaveCount(0);
  await page.getByText("Unavailable record").click();
  await expect(page.getByText(/reactor/i)).toHaveCount(0);
  await expect(page.getByRole("button", { name: "Back" })).toHaveCount(0);

  // Hidden-unavailable records never surface at all.
  await searchbox.fill("personnel");
  await searchbox.press("Enter");
  await expect(page.getByText(/no records match your search/i)).toBeVisible();

  expect(pageErrors).toEqual([]);
  expect(consoleErrors).toEqual([]);
});