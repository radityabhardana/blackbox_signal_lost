import { defineConfig, devices } from "@playwright/test";

const isCI = process.env.CI === "true" || process.env.CI === "1";

export default defineConfig({
  testDir: "./e2e",
  fullyParallel: true,
  forbidOnly: isCI,
  retries: isCI ? 2 : 0,
  ...(isCI ? { workers: 1 } : {}),
  reporter: "list",
  use: {
    baseURL: "http://localhost:3000",
    trace: "on-first-retry",
  },
  projects: [{ name: "chromium", use: { ...devices["Desktop Chrome"] } }],
  webServer: {
    command: "env PLAYWRIGHT_TEST=1 sh -c 'pnpm build && pnpm start'",
    url: "http://localhost:3000",
    reuseExistingServer: !isCI,
    timeout: 240_000,
  },
});
