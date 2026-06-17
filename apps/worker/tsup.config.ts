import { defineConfig } from "tsup";

export default defineConfig({
  entry: ["src/index.ts"],
  format: ["esm"],
  target: "node22",
  clean: true,
  noExternal: [/^@ovr\//],
  // playwright spawns the real browser binary at a path relative to its own
  // package, and pg's CJS internals use dynamic require() patterns esbuild
  // can't convert to ESM — bundling either breaks at runtime.
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
