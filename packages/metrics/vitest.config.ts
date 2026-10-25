import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    name: "metrics",
    env: { LOG_LEVEL: "silent" },
    environment: "node",
    include: ["src/__tests__/**/*.test.ts"],
    unstubEnvs: true,
  },
});
