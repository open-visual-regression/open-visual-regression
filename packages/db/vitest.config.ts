import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    name: "db",
    environment: "node",
    include: ["src/__tests__/integration/**/*.test.ts"],
    globalSetup: ["./vitest.integration.globalSetup.ts"],
    setupFiles: ["./vitest.integration.setup.ts"],
    fileParallelism: false,
    testTimeout: 30_000,
  },
});
