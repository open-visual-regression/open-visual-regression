import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    name: "worker",
    env: { LOG_LEVEL: "silent" },
    environment: "node",
    include: ["src/**/*.integration.test.ts"],
    globalSetup: ["./vitest.integration.globalSetup.ts"],
    setupFiles: ["./vitest.integration.setup.ts"],
    fileParallelism: false,
    testTimeout: 30_000,
  },
});
