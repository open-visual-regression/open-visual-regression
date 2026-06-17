import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    projects: [
      {
        test: {
          name: "unit",
          environment: "node",
          include: ["src/__tests__/**/*.test.ts"],
          exclude: ["src/__tests__/**/*.integration.test.ts"],
          clearMocks: true,
        },
      },
      {
        test: {
          name: "integration",
          environment: "node",
          include: ["src/__tests__/**/*.integration.test.ts"],
          globalSetup: ["./vitest.integration.globalSetup.ts"],
          setupFiles: ["./vitest.integration.setup.ts"],
          fileParallelism: false,
          testTimeout: 30_000,
        },
      },
    ],
  },
});
