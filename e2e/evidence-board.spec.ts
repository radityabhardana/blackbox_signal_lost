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

test("evidence board: restores canonical edits after browser reload", async ({ page }) => {
  const pageErrors: string[] = [];
  const consoleErrors: string[] = [];
  page.on("pageerror", (error) => pageErrors.push(error.message));
  page.on("console", (message) => { if (message.type() === "error") consoleErrors.push(message.text()); });

  await page.goto("/test/evidence-board");
  await expect(page.locator('[data-hydration-status="ready"]')).toBeVisible();
  await page.getByRole("button", { name: "Launcher" }).click();
  await page.getByRole("menuitem", { name: "Evidence Board" }).click();

  const board = page.getByTestId("window-win_0").getByRole("region", { name: "Evidence Board" });
  await expect(board).toContainText("Test evidence");
  await board.getByLabel("New private note").fill("Reload note");
  await board.getByRole("button", { name: "Add private note" }).click();
  await board.getByRole("button", { name: /Note: Reload note/ }).click();
  await board.getByLabel("Connect selected node").selectOption("evidence:evidence_test");
  await board.getByRole("button", { name: "Create player hypothesis" }).click();
  await board.getByRole("button", { name: "Fit View" }).click();

  const evidenceListItem = board.getByRole("button", { name: "Evidence: Test evidence" });
  const initialX = await evidenceListItem.getAttribute("data-position-x");
  const initialY = await evidenceListItem.getAttribute("data-position-y");
  const flowNode = board.locator('[data-id="evidence:evidence_test"]').first();
  await flowNode.scrollIntoViewIfNeeded();
  const nodeBox = await flowNode.locator("article").boundingBox();
  expect(nodeBox).not.toBeNull();
  const startX = nodeBox!.x + nodeBox!.width / 2;
  const startY = nodeBox!.y + nodeBox!.height / 2;
  await page.mouse.move(startX, startY);
  await page.mouse.down();
  await page.mouse.move(startX + 64, startY + 32, { steps: 10 });
  await page.mouse.up();

  await expect.poll(async () => evidenceListItem.getAttribute("data-position-x")).not.toBe(initialX);
  const movedX = await evidenceListItem.getAttribute("data-position-x");
  const movedY = await evidenceListItem.getAttribute("data-position-y");
  expect(movedX).not.toBe(initialX);
  expect(movedY).not.toBe(initialY);
  await expect(page.locator('[data-persistence-status="saved"]')).toBeVisible();

  await page.reload();
  await expect(page.locator('[data-hydration-status="ready"]')).toBeVisible();
  if (await page.getByTestId("window-win_0").getByRole("region", { name: "Evidence Board" }).count() === 0) {
    await page.getByRole("button", { name: "Launcher" }).click();
    await page.getByRole("menuitem", { name: "Evidence Board" }).click();
  }

  const restoredBoard = page.getByTestId("window-win_0").getByRole("region", { name: "Evidence Board" });
  await expect(restoredBoard.getByRole("button", { name: /Note: Reload note/ })).toBeVisible();
  await expect(restoredBoard.getByRole("button", { name: /Player hypothesis:/ })).toBeVisible();
  const restoredEvidence = restoredBoard.getByRole("button", { name: "Evidence: Test evidence" });
  await expect(restoredEvidence).toHaveAttribute("data-position-x", movedX!);
  await expect(restoredEvidence).toHaveAttribute("data-position-y", movedY!);
  expect(pageErrors).toEqual([]);
  expect(consoleErrors).toEqual([]);
});
