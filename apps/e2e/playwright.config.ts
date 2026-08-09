import { defineConfig, devices } from "@playwright/test";

import { getBaseURL, STORAGE_STATE } from "./tests/constants";

// No webServer: the suite needs a running stack (worker, storage, db), reachable
// at PLAYWRIGHT_BASE_URL, not just the web app.
export default defineConfig({
  testDir: "./tests",
  fullyParallel: true,
  // The specs share one seeded project, and ingesting onto a branch cancels any
  // build still in flight on it, so ingestion must not overlap.
  workers: 1,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 1 : 0,
  reporter: [
    ["list"],
    ["html", { open: "never" }],
    ["junit", { outputFile: "playwright-report/junit.xml" }],
  ],
  timeout: 3 * 60 * 1000,
  expect: { timeout: 30_000 },
  use: {
    baseURL: getBaseURL(),
    trace: "on-first-retry",
    screenshot: "only-on-failure",
  },
  projects: [
    { name: "setup", testMatch: /auth\.setup\.ts/ },
    {
      name: "chromium",
      use: { ...devices["Desktop Chrome"], storageState: STORAGE_STATE },
      dependencies: ["setup"],
    },
  ],
});
