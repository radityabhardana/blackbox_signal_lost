import { expect, test } from "@playwright/test";

test("mail: open queued message, activate evidence attachment, see discovered state", async ({ page }) => {
  const pageErrors: string[] = [];
  page.on("pageerror", (error) => pageErrors.push(error.message));

  await page.goto("/test/mail");

  // Harness guarded: only reachable with PLAYWRIGHT_TEST=1.
  await page.getByRole("button", { name: "Launcher" }).click();
  await page.getByRole("menuitem", { name: /^mail$/i }).click();

  // Select the queued synthetic message.
  await page.getByRole("button", { name: /first test message/i }).click();

  // Attachment starts actionable.
  const evidenceAttachment = page.getByRole("button", { name: /image attachment 1/i });
  await expect(evidenceAttachment).toBeVisible();
  await expect(page.getByText(/Open to inspect/i)).toBeVisible();

  await evidenceAttachment.click();

  // Evidence progress is reflected user-visibly.
  await expect(page.getByText(/Evidence discovered/i)).toBeVisible();

  expect(pageErrors).toEqual([]);
});
