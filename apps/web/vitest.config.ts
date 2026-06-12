import path from "node:path";
import { fileURLToPath } from "node:url";

import react from "@vitejs/plugin-react";
import { defineConfig } from "vitest/config";

import { storybookTest } from "@storybook/addon-vitest/vitest-plugin";

import { playwright } from "@vitest/browser-playwright";

const dirname =
  typeof __dirname !== "undefined" ? __dirname : path.dirname(fileURLToPath(import.meta.url));

export default defineConfig({
  resolve: {
    alias: {
      "@": path.resolve(dirname, "."),
    },
  },
  test: {
    passWithNoTests: true,
    projects: [
      {
        plugins: [react()],
        resolve: {
          alias: {
            "@": path.resolve(dirname, "."),
          },
        },
        test: {
          name: "unit",
          environment: "jsdom",
          globals: true,
          setupFiles: ["./vitest.setup.ts"],
          include: ["app/**/*.test.{ts,tsx}", "lib/**/*.test.{ts,tsx}"],
          exclude: ["app/**/*.integration.test.{ts,tsx}", "lib/**/*.integration.test.ts"],
          clearMocks: true,
          env: {
            BASE_URL: "http://localhost:3000",
          },
        },
      },
      {
        extends: true,
        test: {
          name: "integration",
          environment: "node",
          include: ["app/**/*.integration.test.{ts,tsx}", "lib/**/*.integration.test.ts"],
          globalSetup: ["./vitest.integration.globalSetup.ts"],
          setupFiles: ["./vitest.integration.setup.ts"],
          fileParallelism: false,
          testTimeout: 30_000,
          clearMocks: true,
          env: {
            BASE_URL: "http://localhost:3000",
          },
        },
      },
      {
        extends: true,
        plugins: [storybookTest({ configDir: path.join(dirname, ".storybook") })],
        test: {
          name: "storybook",
          browser: {
            enabled: true,
            headless: true,
            provider: playwright({}),
            instances: [{ browser: "chromium" }],
          },
        },
      },
    ],
  },
});
