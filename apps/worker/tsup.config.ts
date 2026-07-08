import { defineConfig } from "tsup";

export default defineConfig((options) => ({
  entry: ["src/index.ts", "src/migrate.ts"],
  format: ["esm"],
  target: "node22",
  clean: true,
  watch: options.watch && [
    "src",
    "../../packages/builds/src",
    "../../packages/capture/src",
    "../../packages/db/src",
    "../../packages/queue/src",
    "../../packages/reviews/src",
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
    // pino's internals rely on dynamic require() of node builtins (e.g. "os"),
    // which breaks when bundled into ESM output — keep it external like the
    // other native/CJS-heavy deps above.
    "pino",
    "pino-pretty",
  ],
}));
