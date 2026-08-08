import { expect, test } from "@playwright/test";

test("window manager: open, minimize, restore, reset workspace", async ({ page }) => {
  const pageErrors: string[] = [];
  page.on("pageerror", (error) => pageErrors.push(error.message));

  await page.goto("/game");

  await expect(page.getByTestId("workspace-shell")).toBeVisible();
  await expect(page.getByText("Workspace ready — no applications open")).toBeVisible();

  // Open Mail from the launcher.
  await page.getByRole("button", { name: "Launcher" }).click();
  await page.getByRole("menuitem", { name: /^mail$/i }).click();
  await expect(page.getByTestId("window-win_0")).toBeVisible();

  // Open Records; it becomes the focused window above Mail.
  await page.getByRole("button", { name: "Launcher" }).click();
  await page.getByRole("menuitem", { name: /^records$/i }).click();
  await expect(page.getByTestId("window-win_1")).toBeVisible();
  await expect(page.getByRole("button", { name: "Records window, focused" })).toBeVisible();

  // Minimize Records; only Mail remains on the desktop.
  await page.getByRole("button", { name: "Minimize Records" }).click();
  await expect(page.getByTestId("window-win_1")).not.toBeVisible();
  await expect(page.getByRole("button", { name: "Records window, minimized" })).toBeVisible();

  // Restore Records from its taskbar indicator.
  await page.getByRole("button", { name: "Records window, minimized" }).click();
  await expect(page.getByTestId("window-win_1")).toBeVisible();
  await expect(page.getByRole("button", { name: "Records window, focused" })).toBeVisible();

  // Maximize and unmaximize the focused window.
  await page.getByRole("button", { name: "Maximize Records" }).click();
  await expect(page.getByRole("button", { name: "Restore Records" })).toBeVisible();
  await page.getByRole("button", { name: "Restore Records" }).click();

  // Reset workspace restores a safe layout with both windows normal.
  await page.getByRole("button", { name: "Reset workspace" }).click();
  await expect(page.getByTestId("window-win_0")).toBeVisible();
  await expect(page.getByTestId("window-win_1")).toBeVisible();
  await expect(page.getByRole("button", { name: "Records window, focused" })).toBeVisible();

  await expect(pageErrors).toEqual([]);
});