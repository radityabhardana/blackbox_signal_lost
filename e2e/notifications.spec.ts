import { expect, test } from "@playwright/test";

test("notifications: preserves authored history order, duplicates, priorities, and Escape focus", async ({ page }) => {
  const pageErrors: string[] = [];
  page.on("pageerror", (error) => pageErrors.push(error.message));
  const consoleErrors: string[] = [];
  page.on("console", (message) => {
    if (message.type() === "error") {
      consoleErrors.push(message.text());
    }
  });

  await page.goto("/test/notifications");
  const trigger = page.getByRole("button", { name: "Notification center" });
  await trigger.focus();
  await trigger.press("Enter");

  const panel = page.getByRole("region", { name: "Notification center" });
  await expect(panel).toBeVisible();
  await expect(trigger).toBeFocused();
  await expect(panel.getByRole("listitem")).toHaveCount(3);
  await expect(panel.getByRole("listitem").nth(0)).toHaveText(/Informational.*Test notification A/i);
  await expect(panel.getByRole("listitem").nth(1)).toHaveText(/Informational.*Test notification A/i);
  await expect(panel.getByRole("listitem").nth(2)).toHaveText(/System anomaly.*Test notification B/i);

  await trigger.press("Escape");
  await expect(panel).toBeHidden();
  await expect(trigger).toBeFocused();

  await trigger.press("Enter");
  await expect(panel).toBeVisible();
  await expect(panel.getByRole("listitem")).toHaveCount(3);

  expect(pageErrors).toEqual([]);
  expect(consoleErrors).toEqual([]);
});

test("notifications: game shell shows an honest empty notification state before any case notifications", async ({ page }) => {
  const pageErrors: string[] = [];
  page.on("pageerror", (error) => pageErrors.push(error.message));
  const consoleErrors: string[] = [];
  page.on("console", (message) => {
    if (message.type() === "error") {
      consoleErrors.push(message.text());
    }
  });

  await page.goto("/game");
  const trigger = page.getByRole("button", { name: "Notification center" });
  await trigger.click();
  await expect(page.getByText("No notifications")).toBeVisible();

  expect(pageErrors).toEqual([]);
  expect(consoleErrors).toEqual([]);
});
