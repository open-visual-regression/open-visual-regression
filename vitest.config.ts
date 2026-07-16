import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    projects: [
      "apps/web/vitest.config.ts",
      "apps/worker/vitest.config.ts",
      "apps/cli/vitest.config.ts",
      "packages/builds/vitest.config.ts",
      "packages/capture/vitest.config.ts",
      "packages/db/vitest.config.ts",
      "packages/git-status/vitest.config.ts",
      "packages/logger/vitest.config.ts",
      "packages/queue/vitest.config.ts",
      "packages/reviews/vitest.config.ts",
      "packages/storage/vitest.config.ts",
      "packages/api/vitest.config.ts",
      "packages/ui/vitest.config.ts",
    ],
  },
});
