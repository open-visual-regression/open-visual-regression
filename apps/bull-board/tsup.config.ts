import { defineConfig } from "tsup";

export default defineConfig((options) => ({
  entry: ["src/index.ts"],
  format: ["esm"],
  target: "node22",
  clean: true,
  watch: options.watch && ["src", "../../packages/queue/src"],
  noExternal: [/^@ovr\//],
  external: ["bullmq", "ioredis", "express"],
}));
