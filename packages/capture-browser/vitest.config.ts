import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    name: "capture-browser",
    environment: "node",
    include: ["src/__tests__/**/*.test.ts"],
    testTimeout: 30_000,
    restoreMocks: true,
  },
});
