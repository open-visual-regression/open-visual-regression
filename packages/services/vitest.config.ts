import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    name: "services",
    environment: "node",
    include: ["src/**/*.test.ts"],
  },
});
