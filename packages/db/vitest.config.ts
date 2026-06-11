import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    name: "db",
    environment: "node",
    include: ["src/__tests__/integration/**/*.test.ts"],
    setupFiles: ["./src/__tests__/setup.ts"],
    testTimeout: 30000,
    fileParallelism: false,
  },
});
