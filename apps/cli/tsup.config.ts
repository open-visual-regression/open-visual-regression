import { defineConfig } from "tsup";

export default defineConfig([
  {
    entry: ["src/index.ts"],
    format: ["esm"],
    target: "node22",
    clean: true,
    noExternal: ["@ovr/api"],
    banner: {
      js: "#!/usr/bin/env node",
    },
  },
  {
    entry: ["src/defineConfig.ts"],
    format: ["esm"],
    target: "node22",
    dts: true,
  },
]);
