import { defineConfig, devices } from "@playwright/test";

import baseConfig from "./playwright.config";

const browser = {
  ...devices["Desktop Chrome"],
  launchOptions: { args: ["--host-resolver-rules=MAP keycloak 127.0.0.1"] },
};

export default defineConfig({
  ...baseConfig,
  testDir: "./tests/sso",
  testIgnore: [],
  projects: [
    { name: "sso-setup", testMatch: /sso\.setup\.ts/, use: browser },
    { name: "sso", use: browser, dependencies: ["sso-setup"] },
  ],
});
