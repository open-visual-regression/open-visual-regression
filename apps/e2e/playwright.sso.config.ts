import { defineConfig, devices } from "@playwright/test";

import { getBaseURL } from "./tests/constants";

export default defineConfig({
  testDir: "./tests/sso",
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
    {
      name: "sso-setup",
      testMatch: /sso\.setup\.ts/,
      use: {
        ...devices["Desktop Chrome"],
        launchOptions: { args: ["--host-resolver-rules=MAP keycloak 127.0.0.1"] },
      },
    },
    {
      name: "sso",
      use: {
        ...devices["Desktop Chrome"],
        launchOptions: { args: ["--host-resolver-rules=MAP keycloak 127.0.0.1"] },
      },
      dependencies: ["sso-setup"],
    },
  ],
});
