import { defineConfig, devices } from "@playwright/test";

import { getBaseURL, STORAGE_STATE } from "./tests/constants";

// No webServer: the suite needs a running stack (worker, storage, db), reachable
// at PLAYWRIGHT_BASE_URL, not just the web app.
export default defineConfig({
  testDir: "./tests",
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 1 : 0,
  reporter: [
    ["list"],
    ["html", { open: "never" }],
    ["junit", { outputFile: "playwright-report/junit.xml" }],
  ],
  // Generous per-test timeout: specs ingest a Storybook build and wait on the
  // worker to capture it.
  timeout: 15 * 60 * 1000,
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
