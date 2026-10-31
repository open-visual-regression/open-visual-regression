import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    name: "capture-browser-stress",
    environment: "node",
    include: ["stress/**/*.stress.test.ts"],
    testTimeout: 1_800_000,
  },
});
