import { expect, test } from "@playwright/test";

test("evidence board: retains board edits while its window closes and reopens", async ({ page }) => {
  const pageErrors: string[] = [];
  const consoleErrors: string[] = [];
  page.on("pageerror", (error) => pageErrors.push(error.message));
  page.on("console", (message) => { if (message.type() === "error") consoleErrors.push(message.text()); });
  await page.goto("/test/evidence-board");
  await page.getByRole("button", { name: "Launcher" }).click();
  await page.getByRole("menuitem", { name: "Evidence Board" }).click();
  const board = page.getByTestId("window-win_0").getByRole("region", { name: "Evidence Board" });
  await expect(board).toContainText("Test evidence");
  await expect(board).toContainText("Second board evidence");
  await board.getByLabel("New private note").fill("Field note");
  await board.getByRole("button", { name: "Add private note" }).click();
  await board.getByRole("button", { name: /Note: Field note/ }).click();
  await board.getByLabel("Connect selected node").selectOption("evidence:evidence_test");
  await board.getByRole("button", { name: "Create player hypothesis" }).click();
  await expect(board.getByRole("button", { name: /Player hypothesis:/ })).toBeVisible();
  await page.getByRole("button", { name: "Close Evidence Board" }).click();
  await page.getByRole("button", { name: "Launcher" }).click();
  await page.getByRole("menuitem", { name: "Evidence Board" }).click();
  await expect(page.getByRole("button", { name: "Note: Field note" })).toBeVisible();
  await expect(page.getByRole("button", { name: /Player hypothesis: evidence:evidence_test - note_0/ })).toBeVisible();
  expect(pageErrors).toEqual([]);
  expect(consoleErrors).toEqual([]);
});
