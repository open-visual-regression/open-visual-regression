import { dirname, resolve } from "path";
import { fileURLToPath } from "url";

import type { StorybookConfig } from "@storybook/nextjs-vite";
import tailwindcss from "@tailwindcss/vite";

const storybookDir = dirname(fileURLToPath(import.meta.url));

const getAbsolutePath = (value: string) => {
  return dirname(fileURLToPath(import.meta.resolve(`${value}/package.json`)));
};

const config: StorybookConfig = {
  stories: ["../**/__stories__/**/*.stories.@(js|jsx|mjs|ts|tsx)"],
  staticDirs: [{ from: "./static/images", to: "/api/storage" }],
  addons: [
    getAbsolutePath("@chromatic-com/storybook"),
    getAbsolutePath("@storybook/addon-vitest"),
    getAbsolutePath("@storybook/addon-a11y"),
    getAbsolutePath("@storybook/addon-docs"),
    getAbsolutePath("@storybook/addon-mcp"),
  ],
  framework: getAbsolutePath("@storybook/nextjs-vite"),
  viteFinal: async (config) => {
    config.plugins = config.plugins ?? [];
    config.plugins.push(tailwindcss());
    config.resolve = config.resolve ?? {};
    config.resolve.alias = {
      ...config.resolve.alias,
      "@/lib/router": resolve(storybookDir, "./mocks/router.ts"),
    };
    return config;
  },
};

export default config;
