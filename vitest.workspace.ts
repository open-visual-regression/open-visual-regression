import { defineWorkspace } from "vitest/config";

export default defineWorkspace([
  "apps/web/vitest.config.ts",
  "apps/worker/vitest.config.ts",
  "apps/cli/vitest.config.ts",
  "packages/db/vitest.config.ts",
  "packages/queue/vitest.config.ts",
  "packages/services/vitest.config.ts",
  "packages/storage/vitest.config.ts",
  "packages/api/vitest.config.ts",
  "packages/ui/vitest.config.ts",
]);
