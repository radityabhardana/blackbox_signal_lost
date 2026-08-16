import { expect, test } from "@playwright/test";

test("landing page renders and links to the game route", async ({ page }) => {
  await page.goto("/");

  await expect(
    page.getByRole("heading", { level: 1, name: /blackbox: signal lost/i }),
  ).toBeVisible();

  await page.getByRole("link", { name: /start investigation/i }).click();

  await expect(page).toHaveURL(/\/game$/);
  await expect(page.getByTestId("workspace-shell")).toBeVisible();
  await expect(page.locator('[data-hydration-status="ready"]')).toBeVisible();
  await expect(page.getByText(/case: missing signal/i)).toBeVisible();
});
