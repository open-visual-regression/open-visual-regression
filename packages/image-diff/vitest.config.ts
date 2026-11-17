import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    name: "image-diff",
    environment: "node",
    include: ["src/__tests__/**/*.test.ts"],
    restoreMocks: true,
  },
});
