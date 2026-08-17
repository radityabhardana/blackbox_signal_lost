import { expect, test } from "@playwright/test";

// Visual-foundation smoke E2E (BBX-110): brand marks on the landing page and
// the integrated icon/texture/visual foundation on /game. Stays at the smoke
// surface — it does NOT replay Case 001 stages.
//
// Selector policy: role/text assertions over class names. Icon integration is
// asserted as "an svg inside the labelled container" so the spec tolerates
// in-flight icon-lane edits that keep the text labels stable.

test.describe("visual foundation", () => {
  test("landing page renders the BLACKBOX brand marks and enters the game", async ({ page }) => {
    const pageErrors: string[] = [];
    page.on("pageerror", (error) => pageErrors.push(error.message));
    const consoleErrors: string[] = [];
    page.on("console", (message) => {
      if (message.type() === "error") {
        consoleErrors.push(message.text());
      }
    });

    await page.goto("/");

    // Wordmark: the only informative brand mark (role="img" + <title>BLACKBOX).
    const wordmark = page.getByRole("img", { name: "BLACKBOX" });
    await expect(wordmark).toBeVisible();

    // Page title semantics preserved alongside the wordmark.
    await expect(
      page.getByRole("heading", { level: 1, name: /blackbox: signal lost/i }),
    ).toBeVisible();

    // Start investigation enters the game route.
    const start = page.getByRole("link", { name: /start investigation/i });
    await expect(start).toBeVisible();
    await start.click();

    await expect(page).toHaveURL(/\/game$/);
    await expect(page.locator('[data-hydration-status="ready"]')).toBeVisible();

    expect(pageErrors).toEqual([]);
    expect(consoleErrors).toEqual([]);
  });

  test("/game renders the icon foundation, keeps locked semantics, and survives reload", async ({
    page,
  }) => {
    const pageErrors: string[] = [];
    page.on("pageerror", (error) => pageErrors.push(error.message));
    const consoleErrors: string[] = [];
    page.on("console", (message) => {
      if (message.type() === "error") {
        consoleErrors.push(message.text());
      }
    });

    await page.goto("/game");
    await expect(page.locator('[data-hydration-status="ready"]')).toBeVisible();
    await expect(page.getByText(/case: missing signal/i)).toBeVisible();

    // Desktop texture class applied to the workspace surface (asset 404s
    // surface through the console-error collector below).
    const workspace = page.getByTestId("workspace-shell");
    await expect(workspace).toBeVisible();
    await expect(workspace).toHaveClass(/bbx-desktop/);

    // Taskbar brand symbol: decorative svg beside the Launcher trigger text.
    const launcherButton = page.getByRole("button", { name: "Launcher" });
    await expect(launcherButton).toBeVisible();
    await expect(launcherButton.locator("svg")).toBeVisible();

    // ---- Launcher opens with icons beside text labels ----
    await launcherButton.click();
    const menu = page.getByRole("menu", { name: "Applications" });
    await expect(menu).toBeVisible();

    const mailItem = menu.getByRole("menuitem", { name: "Mail" });
    await expect(mailItem).toBeVisible();
    await expect(mailItem.locator("svg")).toBeVisible();
    await expect(mailItem).toContainText("Mail");

    // Locked semantics unchanged at fresh start: requiresUnlock apps are
    // filtered out of the launcher (absent, not disabled).
    await expect(menu.getByRole("menuitem", { name: "Signal Analyzer" })).toHaveCount(0);
    await expect(menu.getByRole("menuitem", { name: "Conclusion Report" })).toHaveCount(0);

    // ---- Records window: title bar icon + title, evidence visual + text ----
    await menu.getByRole("menuitem", { name: "Records" }).click();
    const recordsWindow = page.getByRole("region", { name: "Records" });
    await expect(recordsWindow).toBeVisible();

    // Title bar: app icon svg beside the "Records" title (the first header in
    // the window frame is the title bar).
    const titlebar = recordsWindow.locator("header").first();
    await expect(titlebar.getByText("Records")).toBeVisible();
    await expect(titlebar.locator("svg").first()).toBeVisible();

    const searchbox = page.getByRole("searchbox", { name: /search records/i });
    await searchbox.fill("ferry");
    await searchbox.press("Enter");
    await page.getByRole("button", { name: /ferry departure record/i }).click();

    // Decorative evidence visual renders AND the semantic metadata text
    // remains the authoritative content.
    const recordDetail = recordsWindow.getByRole("region", { name: "Record" });
    await expect(recordDetail.getByRole("heading", { name: /ferry departure record/i })).toBeVisible();
    await expect(recordDetail.locator("svg").first()).toBeVisible();
    await expect(recordDetail.getByText(/meridian ferry gate/i)).toBeVisible();

    // ---- Keyboard: open the launcher via Tab/Enter, Escape closes it ----
    await page.getByRole("button", { name: /close records/i }).click();
    await launcherButton.focus();
    await page.keyboard.press("Enter");
    await expect(menu).toBeVisible();
    await expect(menu.getByRole("menuitem").first()).toBeFocused();
    await page.keyboard.press("Escape");
    await expect(menu).toBeHidden();
    await expect(launcherButton).toBeFocused();

    // ---- Reload: hydration recovers without errors ----
    await page.reload();
    await expect(page.locator('[data-hydration-status="ready"]')).toBeVisible();
    await expect(page.getByText(/case: missing signal/i)).toBeVisible();

    // No page errors, no console errors (covers failed asset requests).
    expect(pageErrors).toEqual([]);
    expect(consoleErrors).toEqual([]);
  });
});
