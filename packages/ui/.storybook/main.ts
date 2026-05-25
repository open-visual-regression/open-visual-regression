import type { StorybookConfig } from "@storybook/react-vite";

import tailwindcss from "@tailwindcss/vite";

import { dirname, resolve } from "path";

import { fileURLToPath } from "url";

const __dirname = dirname(fileURLToPath(import.meta.url));

const getAbsolutePath = (value: string) => {
  return dirname(fileURLToPath(import.meta.resolve(`${value}/package.json`)));
};

const config: StorybookConfig = {
  stories: ["../**/__stories__/**/*.mdx", "../**/__stories__/**/*.stories.@(js|jsx|mjs|ts|tsx)"],
  addons: [
    getAbsolutePath("@chromatic-com/storybook"),
    getAbsolutePath("@storybook/addon-vitest"),
    getAbsolutePath("@storybook/addon-a11y"),
    getAbsolutePath("@storybook/addon-docs"),
    getAbsolutePath("@storybook/addon-mcp"),
  ],
  framework: getAbsolutePath("@storybook/react-vite"),
  viteFinal: async (config) => {
    config.plugins = config.plugins ?? [];
    config.plugins.push(tailwindcss());
    config.resolve = config.resolve ?? {};
    config.resolve.alias = {
      ...config.resolve.alias,
      "@": resolve(__dirname, ".."),
    };
    return config;
  },
};

export default config;
