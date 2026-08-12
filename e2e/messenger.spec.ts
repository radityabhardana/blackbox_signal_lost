import { expect, test } from "@playwright/test";

test("messenger: open queued message, activate authored choice, see reply and disabled state", async ({ page }) => {
  const pageErrors: string[] = [];
  page.on("pageerror", (error) => pageErrors.push(error.message));
  const consoleErrors: string[] = [];
  page.on("console", (message) => {
    if (message.type() === "error") {
      consoleErrors.push(message.text());
    }
  });

  await page.goto("/test/messenger");

  // Harness guarded: only reachable with PLAYWRIGHT_TEST=1.
  await page.getByRole("button", { name: "Launcher" }).click();
  await page.getByRole("menuitem", { name: /^messenger$/i }).click();

  // The queued synthetic greeting is rendered with its authored choice.
  await expect(page.getByText(/first test message/i)).toBeVisible();

  const acknowledge = page.getByRole("button", { name: /acknowledge — continue/i });
  await expect(acknowledge).toBeEnabled();

  // Activating the choice queues the authored reply exactly once and disables
  // the choice button (re-click safety derived from selectedChoices).
  await acknowledge.click();

  await expect(page.getByText(/reply acknowledged/i)).toBeVisible();
  await expect(page.getByText(/reply acknowledged/i)).toHaveCount(1);
  await expect(acknowledge).toBeDisabled();

  expect(pageErrors).toEqual([]);
  expect(consoleErrors).toEqual([]);
});

test("messenger: undefined messengerChannelId renders the honest No messages empty state", async ({ page }) => {
  const pageErrors: string[] = [];
  page.on("pageerror", (error) => pageErrors.push(error.message));
  const consoleErrors: string[] = [];
  page.on("console", (message) => {
    if (message.type() === "error") {
      consoleErrors.push(message.text());
    }
  });

  // Messenger is reachable from the existing mail harness, which configures
  // no messengerChannelId — the app must render the empty state, not crash.
  await page.goto("/test/mail");

  await page.getByRole("button", { name: "Launcher" }).click();
  await page.getByRole("menuitem", { name: /^messenger$/i }).click();

  await expect(page.locator('[role="region"][aria-label="Messenger"]')).toHaveText(/No messages/i);

  expect(pageErrors).toEqual([]);
  expect(consoleErrors).toEqual([]);
});