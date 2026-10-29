import { defineConfig, devices } from "@playwright/test";

import baseConfig from "./playwright.config";
import { STORAGE_STATE } from "./tests/constants";

export default defineConfig({
  ...baseConfig,
  testIgnore: ["sso/**"],
  projects: [
    { name: "setup", testMatch: /auth\.setup\.ts/ },
    {
      name: "github-app",
      testMatch: /github-app\/.*\.spec\.ts/,
      use: { ...devices["Desktop Chrome"], storageState: STORAGE_STATE },
      dependencies: ["setup"],
    },
  ],
});
