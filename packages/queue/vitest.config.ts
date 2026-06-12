import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    name: "queue",
    environment: "node",
    include: ["src/__tests__/**/*.integration.test.ts"],
    globalSetup: ["./vitest.integration.globalSetup.ts"],
    testTimeout: 30000,
  },
});
