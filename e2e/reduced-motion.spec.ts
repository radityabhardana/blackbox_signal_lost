import { expect, test } from "@playwright/test";

// Reduced-motion E2E: with prefers-reduced-motion: reduce, the boot overlay is
// still skippable, the workspace still renders, and the desktop signal is
// mirrored onto <html data-reduced-motion="reduce">. Motion is neutralized by the
// platform-level CSS override (globals.css), not by JS branching.
test.use({ contextOptions: { reducedMotion: "reduce" } });

test("reduced motion: workspace renders, boot is skippable, and the motion signal is set", async ({ page }) => {
  const pageErrors: string[] = [];
  page.on("pageerror", (error) => pageErrors.push(error.message));
  const consoleErrors: string[] = [];
  page.on("console", (message) => { if (message.type() === "error") consoleErrors.push(message.text()); });

  await page.goto("/game");
  await expect(page.locator('[data-hydration-status="ready"]')).toBeVisible();

  // The boot script mirrors the reduced-motion preference onto <html>.
  await expect(page.locator("html")).toHaveAttribute("data-reduced-motion", "reduce");

  // Boot overlay still presents its skip control (usable, not animated away).
  await page.getByRole("button", { name: "Skip to main content" }).click();

  // The workspace shell renders normally under reduced motion.
  await expect(page.getByTestId("workspace-shell")).toBeVisible();
  await expect(page.getByText(/case: missing signal/i)).toBeVisible();

  expect(pageErrors).toEqual([]);
  expect(consoleErrors).toEqual([]);
});
