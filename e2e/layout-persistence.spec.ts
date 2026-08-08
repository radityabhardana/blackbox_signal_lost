import { expect, test } from "@playwright/test";

test("layout persists, restores, and survives reset", async ({ page }) => {
  const pageErrors: string[] = [];
  page.on("pageerror", (error) => pageErrors.push(error.message));

  await page.goto("/game");

  // Open Mail.
  await page.getByRole("button", { name: "Launcher" }).click();
  await page.getByRole("menuitem", { name: /^mail$/i }).click();
  await expect(page.getByTestId("window-win_0")).toBeVisible();

  // Drag Mail out of the way so there is no overlap between windows.
  const mailTitle = page.getByTestId("window-win_0").locator(".bbx-window-title");
  const mailTitleBox = await mailTitle.boundingBox();
  if (!mailTitleBox) throw new Error("Mail title not measurable");
  await page.mouse.move(mailTitleBox.x + mailTitleBox.width / 2, mailTitleBox.y + mailTitleBox.height / 2);
  await page.mouse.down();
  await page.mouse.move(
    mailTitleBox.x + mailTitleBox.width / 2 + 560,
    mailTitleBox.y + mailTitleBox.height / 2 + 400,
    { steps: 8 },
  );
  await page.mouse.up();

  const movedBox = await page.getByTestId("window-win_0").boundingBox();
  expect(movedBox?.x ?? -1).toBeGreaterThan(300);

  // Open Records (top of the stack, top-left).
  await page.getByRole("button", { name: "Launcher" }).click();
  await page.getByRole("menuitem", { name: /^records$/i }).click();
  await expect(page.getByTestId("window-win_1")).toBeVisible();

  // Minimize Records so the layout carries both a moved window and a minimized one.
  await page.getByRole("button", { name: "Minimize Records" }).click();

  // Poll until the persisted snapshot reflects the latest state (no sleep).
  await page.waitForFunction(
    () => {
      const raw = window.localStorage.getItem("bbx.window.layout");
      if (!raw) return false;
      try {
        const data: { openWindows: { id: string; bounds: { x: number; y: number }; display: string }[] } =
          JSON.parse(raw);
        const mail = data.openWindows.find((w) => w.id === "win_0");
        const records = data.openWindows.find((w) => w.id === "win_1");
        return (mail?.bounds?.x ?? 0) >= 300 && records?.display === "minimized";
      } catch {
        return false;
      }
    },
    undefined,
    { timeout: 10_000 },
  );

  // Reload and verify restoration.
  await page.reload();
  await expect(page.getByTestId("window-win_0")).toBeVisible();
  await expect(page.getByRole("button", { name: /mail window, focused/i })).toBeVisible();
  const restoredBox = await page.getByTestId("window-win_0").boundingBox();
  expect(restoredBox?.x ?? -1).toBeGreaterThanOrEqual(300);
  await expect(page.getByTestId("window-win_1")).toHaveCount(0);
  await expect(page.getByRole("button", { name: /records window, minimized/i })).toBeVisible();

  // Reset workspace and verify the reset layout is persisted.
  await page.getByRole("button", { name: "Reset workspace" }).click();
  await expect(page.getByTestId("window-win_0")).toBeVisible();
  await page.waitForFunction(() => {
    const raw = window.localStorage.getItem("bbx.window.layout");
    if (!raw) return false;
    try {
      const data: { openWindows: { display: string }[] } = JSON.parse(raw);
      return (
        data.openWindows?.length === 2 &&
        data.openWindows.every((w) => w.display === "normal")
      );
    } catch {
      return false;
    }
  });

  // Reload again: the reset (safe) layout must remain.
  await page.reload();
  await expect(page.getByTestId("window-win_0")).toBeVisible();
  await expect(page.getByTestId("window-win_1")).toBeVisible();
  await expect(page.getByRole("button", { name: /records window, focused/i })).toBeVisible();

  expect(pageErrors).toEqual([]);
});

test("malformed stored layout starts clean and recovers", async ({ page }) => {
  const pageErrors: string[] = [];
  page.on("pageerror", (error) => pageErrors.push(error.message));

  await page.addInitScript(() => {
    window.localStorage.setItem("bbx.window.layout", "{not-json");
  });

  await page.goto("/game");
  await expect(page.getByTestId("window-win_0")).toHaveCount(0);
  await expect(page.getByText(/no applications open/i)).toBeVisible();

  // The desktop still works and can open apps afterward.
  await page.getByRole("button", { name: "Launcher" }).click();
  await page.getByRole("menuitem", { name: /^mail$/i }).click();
  await expect(page.getByTestId("window-win_0")).toBeVisible();
  await page.waitForFunction(() => {
    const raw = window.localStorage.getItem("bbx.window.layout");
    if (!raw) return false;
    try {
      const data: { openWindows: { id: string }[] } = JSON.parse(raw);
      return data.openWindows?.length === 1 && data.openWindows[0]?.id === "win_0";
    } catch {
      return false;
    }
  });

  expect(pageErrors).toEqual([]);
});