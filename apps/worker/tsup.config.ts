import { defineConfig } from "tsup";

export default defineConfig({
  entry: ["src/index.ts"],
  format: ["esm"],
  target: "node22",
  clean: true,
  watch: [
    "src",
    "../../packages/db/src",
    "../../packages/queue/src",
    "../../packages/services/src",
    "../../packages/storage/src",
  ],
  noExternal: [/^@ovr\//],
  external: [
    "playwright",
    "playwright-core",
    "bullmq",
    "ioredis",
    "tar",
    "pixelmatch",
    "pngjs",
    "pg",
  ],
});
