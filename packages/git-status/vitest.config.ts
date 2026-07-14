import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    name: "git-status",
    environment: "node",
    include: ["src/__tests__/**/*.test.ts"],
    setupFiles: ["./src/__tests__/setup.ts"],
    unstubEnvs: true,
    unstubGlobals: true,
    restoreMocks: true,
  },
});
