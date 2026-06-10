import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    name: "db",
    environment: "node",
    include: ["src/__tests__/integration/**/*.test.ts"],
    testTimeout: 30000,
    passWithNoTests: true,
  },
});
