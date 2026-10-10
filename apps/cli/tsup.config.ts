import { defineConfig } from "tsup";

export default defineConfig([
  {
    entry: ["src/index.ts"],
    format: ["esm"],
    target: "node22",
    clean: true,
    noExternal: ["@ovr/api", "@ovr/capture-browser", "@ovr/storybook-compat"],
    external: ["playwright"],
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
