import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    name: "capture",
    environment: "node",
    include: ["src/**/__tests__/**/*.test.ts"],
    globalSetup: ["./vitest.integration.globalSetup.ts"],
    setupFiles: ["./vitest.integration.setup.ts"],
    fileParallelism: false,
    testTimeout: 30_000,
    restoreMocks: true,
  },
});
